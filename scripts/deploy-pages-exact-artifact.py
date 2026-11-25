#!/usr/bin/env python3
"""Deploy the exact upload output through GitHub's Pages API with OIDC.

GET metadata visibility is bounded and retryable. A possibly accepted POST is
never repeated: its exact build-version status is reconciled instead.
"""
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


class ApiError(RuntimeError):
    def __init__(self, status):
        self.status = status
        super().__init__(f'GitHub API HTTP {status}')


def identity(env):
    repo, sha = env['GITHUB_REPOSITORY'], env['GITHUB_SHA']
    artifact, run = env['PAGES_ARTIFACT_ID'], env['GITHUB_RUN_ID']
    if repo != 'chuyiouart/ouart-model-site' or not re.fullmatch('[0-9a-f]{40}', sha):
        raise ValueError('unexpected repository or commit')
    if not re.fullmatch('[1-9][0-9]*', artifact) or not re.fullmatch('[1-9][0-9]*', run):
        raise ValueError('exact upload artifact ID and run ID required')
    return {'repo': repo, 'sha': sha, 'artifact_id': int(artifact), 'run_id': int(run)}


def validate_artifact(row, expected):
    run = row.get('workflow_run') or {}
    if (row.get('id') != expected['artifact_id'] or row.get('name') != 'github-pages'
            or row.get('expired') is not False or run.get('id') != expected['run_id']
            or run.get('head_sha') != expected['sha'] or run.get('head_branch') != 'main'
            or not 0 < int(row.get('size_in_bytes') or 0) <= 1024**3
            or not re.fullmatch(r'sha256:[0-9a-f]{64}', row.get('digest') or '')):
        raise ValueError('uploaded artifact identity, digest, expiration or size mismatch')
    return row


class GitHub:
    def __init__(self, env):
        self.token = env['GH_TOKEN']
        self.oidc_url = env['ACTIONS_ID_TOKEN_REQUEST_URL']
        self.oidc_request_token = env['ACTIONS_ID_TOKEN_REQUEST_TOKEN']
        if not self.oidc_url.startswith('https://'):
            raise ValueError('HTTPS OIDC endpoint required')

    def request(self, method, path, payload=None):
        if not path.startswith('/repos/chuyiouart/ouart-model-site/'):
            raise ValueError('foreign repository API path')
        request = urllib.request.Request('https://api.github.com' + path,
            data=json.dumps(payload).encode() if payload is not None else None,
            headers={'Authorization': 'Bearer ' + self.token,
                     'Accept': 'application/vnd.github+json',
                     'Content-Type': 'application/json',
                     'X-GitHub-Api-Version': '2022-11-28',
                     'User-Agent': 'OUART-exact-Pages-artifact/1.0'}, method=method)
        try:
            with urllib.request.urlopen(request, timeout=25) as response:
                body = response.read()
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as error:
            raise ApiError(error.code) from None

    def oidc(self):
        request = urllib.request.Request(self.oidc_url,
            headers={'Authorization': 'Bearer ' + self.oidc_request_token})
        with urllib.request.urlopen(request, timeout=25) as response:
            value = json.load(response).get('value')
        if not isinstance(value, str) or not value:
            raise ValueError('OIDC token unavailable')
        return value


def deploy(api, expected, *, clock=time.monotonic, sleep=time.sleep, emit=lambda row: None):
    root = '/repos/' + expected['repo']
    metadata_deadline = clock() + 120
    while True:
        try:
            artifact = api.request('GET', root + '/actions/artifacts/' + str(expected['artifact_id']))
            validate_artifact(artifact, expected)
            break
        except ApiError as error:
            if error.status not in (404, 429, 500, 502, 503, 504):
                raise
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            pass
        if clock() >= metadata_deadline:
            raise TimeoutError('exact uploaded artifact not visible within 120 seconds')
        sleep(min(5, max(0, metadata_deadline - clock())))

    proof = {'schema': 'OUART_EXACT_PAGES_ARTIFACT_V1', **expected,
             'artifact_digest': artifact['digest'], 'artifact_bytes': artifact['size_in_bytes'],
             'status': 'artifact_verified'}
    emit(proof)
    # Getting OIDC precedes the irreversible request. Tokens never enter proofs.
    oidc_token = api.oidc()
    deployment_id = expected['sha']
    page_url = 'https://chuyiouart.github.io/ouart-model-site/'
    try:
        result = api.request('POST', root + '/pages/deployments', {
            'artifact_id': expected['artifact_id'],
            'pages_build_version': expected['sha'], 'oidc_token': oidc_token})
        deployment_id = str(result.get('id') or deployment_id)
        page_url = result.get('page_url') or page_url
        proof['status'] = 'deployment_submitted'
    except ApiError as error:
        if error.status not in (409, 429, 500, 502, 503, 504):
            raise
        proof['status'] = 'submission_unknown'
    except (urllib.error.URLError, TimeoutError, ConnectionError):
        proof['status'] = 'submission_unknown'
    if not re.fullmatch('[A-Za-z0-9_-]{1,100}', deployment_id):
        raise ValueError('unexpected deployment identifier')
    if page_url.rstrip('/') != 'https://chuyiouart.github.io/ouart-model-site':
        raise ValueError('unexpected deployment public origin')
    proof.update(deployment_id=deployment_id, page_url=page_url)
    emit(proof)
    deadline = clock() + 600
    final_errors = {'deployment_failed', 'deployment_content_failed',
                    'deployment_cancelled', 'deployment_lost'}
    while clock() < deadline:
        try:
            state = api.request('GET', root + '/pages/deployments/' + deployment_id)
        except ApiError as error:
            if error.status not in (404, 429, 500, 502, 503, 504):
                raise
            state = {'status': 'temporarily_unavailable'}
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            state = {'status': 'temporarily_unavailable'}
        observed = state.get('status')
        proof['provider_status'] = observed
        if observed == 'succeed':
            proof['status'] = 'deployment_succeeded'
            emit(proof)
            return proof
        if observed in final_errors:
            proof['status'] = 'deployment_failed'
            emit(proof)
            raise RuntimeError('Pages terminal state: ' + str(observed))
        emit(proof)
        sleep(min(5, max(0, deadline - clock())))
    proof['status'] = 'deployment_timeout'
    emit(proof)
    # Cancel only the exact deployment, never create a second uncertain request.
    try:
        api.request('POST', root + '/pages/deployments/' + deployment_id + '/cancel')
    except (ApiError, OSError):
        pass
    raise TimeoutError('Pages deployment did not succeed within 600 seconds')


def main():
    expected = identity(os.environ)
    proof_path = Path('pages-deployment-proof.json')

    def emit(row):
        proof_path.write_text(json.dumps(row, indent=2) + '\n', encoding='utf-8')
        print('Pages exact-artifact state: ' + row['status'] +
              (' / ' + str(row['provider_status']) if 'provider_status' in row else ''), flush=True)

    proof = deploy(GitHub(os.environ), expected, emit=emit)
    with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as output:
        output.write('page_url=' + proof['page_url'] + '\n')


if __name__ == '__main__':
    main()
