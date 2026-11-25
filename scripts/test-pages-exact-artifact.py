#!/usr/bin/env python3
import copy
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('exact_pages', Path(__file__).with_name('deploy-pages-exact-artifact.py'))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
EXPECTED = {'repo': 'chuyiouart/ouart-model-site', 'sha': 'a' * 40,
            'artifact_id': 14986327230, 'run_id': 45535296092}


def metadata():
    return {'id': EXPECTED['artifact_id'], 'name': 'github-pages', 'expired': False,
            'size_in_bytes': 69173271, 'digest': 'sha256:' + 'b' * 64,
            'workflow_run': {'id': EXPECTED['run_id'], 'head_sha': EXPECTED['sha'], 'head_branch': 'main'}}


class Clock:
    def __init__(self): self.now = 0
    def clock(self): return self.now
    def sleep(self, seconds): self.now += seconds


class Api:
    def __init__(self):
        self.calls = []
        self.metadata = [metadata()]
        self.states = [{'status': 'succeed'}]
        self.post = {'id': 'exact-deployment', 'page_url': 'https://chuyiouart.github.io/ouart-model-site/'}
        self.oidc_calls = 0

    def request(self, method, path, payload=None, **kwargs):
        self.calls.append((method, path, payload))
        if method == 'GET' and '/actions/artifacts/' in path:
            value = self.metadata.pop(0) if len(self.metadata) > 1 else self.metadata[0]
        elif method == 'GET':
            value = self.states.pop(0) if len(self.states) > 1 else self.states[0]
        elif path.endswith('/cancel'): return {}
        else: value = self.post
        if isinstance(value, Exception): raise value
        return value

    def oidc(self):
        self.oidc_calls += 1
        return 'TEST_SECRET_OIDC'


class ExactPagesTests(unittest.TestCase):
    def run_deploy(self, api, emit=lambda row: None):
        clock = Clock()
        return mod.deploy(api, EXPECTED, clock=clock.clock, sleep=clock.sleep, emit=emit)

    def test_exact_id_deploy_never_uses_name_listing(self):
        api = Api(); proof = self.run_deploy(api)
        self.assertEqual(proof['status'], 'deployment_succeeded')
        self.assertEqual(api.calls[0][1].rsplit('/', 1)[-1], str(EXPECTED['artifact_id']))
        creates = [c for c in api.calls if c[0] == 'POST']
        self.assertEqual(len(creates), 1)
        self.assertEqual(creates[0][2]['artifact_id'], EXPECTED['artifact_id'])
        self.assertNotIn('TEST_SECRET_OIDC', str(proof))

    def test_metadata_eventual_visibility_does_not_repeat_upload_or_create(self):
        api = Api(); api.metadata = [mod.ApiError(404), mod.ApiError(503), metadata()]
        self.run_deploy(api)
        self.assertEqual(sum(c[0] == 'POST' for c in api.calls), 1)

    def test_other_run_is_rejected_before_side_effect(self):
        api = Api(); api.metadata[0]['workflow_run']['id'] += 1
        with self.assertRaises(ValueError): self.run_deploy(api)
        self.assertEqual(api.oidc_calls, 0)
        self.assertFalse(any(c[0] == 'POST' for c in api.calls))

    def test_other_commit_is_rejected(self):
        value = metadata(); value['workflow_run']['head_sha'] = 'c' * 40
        with self.assertRaises(ValueError): mod.validate_artifact(value, EXPECTED)

    def test_artifact_binding_guards(self):
        for field, value in [('id', 2), ('name', 'other'), ('expired', True),
                             ('size_in_bytes', 0), ('size_in_bytes', 1024**3 + 1), ('digest', 'bad')]:
            with self.subTest(field=field, value=value):
                row = metadata(); row[field] = value
                with self.assertRaises(ValueError): mod.validate_artifact(row, EXPECTED)

    def test_metadata_unavailable_is_bounded_without_submission(self):
        api = Api(); api.metadata = [mod.ApiError(404)]
        with self.assertRaises(TimeoutError): self.run_deploy(api)
        self.assertFalse(any(c[0] == 'POST' for c in api.calls))

    def test_metadata_permission_error_fails_immediately(self):
        api = Api(); api.metadata = [mod.ApiError(403)]
        with self.assertRaises(mod.ApiError): self.run_deploy(api)
        self.assertEqual(len(api.calls), 1)

    def test_ambiguous_create_reads_exact_sha_without_second_post(self):
        for error in (TimeoutError('ambiguous'), mod.ApiError(503)):
            with self.subTest(error=type(error).__name__):
                api = Api(); api.post = error
                api.states = [mod.ApiError(404), {'status': 'succeed'}]
                proof = self.run_deploy(api)
                self.assertEqual(proof['deployment_id'], EXPECTED['sha'])
                self.assertEqual(sum(c[0] == 'POST' for c in api.calls), 1)

    def test_create_permission_error_is_not_retried(self):
        api = Api(); api.post = mod.ApiError(403)
        with self.assertRaises(mod.ApiError): self.run_deploy(api)
        self.assertEqual(sum(c[0] == 'POST' for c in api.calls), 1)

    def test_terminal_deployment_failure_is_not_replayed(self):
        api = Api(); api.states = [{'status': 'deployment_content_failed'}]
        with self.assertRaises(RuntimeError): self.run_deploy(api)
        self.assertEqual(sum(c[0] == 'POST' for c in api.calls), 1)

    def test_timeout_cancels_only_exact_deployment(self):
        api = Api(); api.states = [{'status': 'queued'}]
        with self.assertRaises(TimeoutError): self.run_deploy(api)
        posts = [c for c in api.calls if c[0] == 'POST']
        self.assertEqual(len(posts), 2)
        self.assertTrue(posts[-1][1].endswith('/exact-deployment/cancel'))

    def test_foreign_page_origin_is_rejected(self):
        api = Api(); api.post = {'id': 'x', 'page_url': 'https://example.com/'}
        with self.assertRaises(ValueError): self.run_deploy(api)

    def test_missing_upload_output_is_rejected(self):
        env = {'GITHUB_REPOSITORY': EXPECTED['repo'], 'GITHUB_SHA': EXPECTED['sha'],
               'PAGES_ARTIFACT_ID': '', 'GITHUB_RUN_ID': str(EXPECTED['run_id'])}
        with self.assertRaises(ValueError): mod.identity(env)

    def test_workflow_has_exact_output_and_minimal_read_permissions(self):
        workflow = (Path(__file__).resolve().parents[1] / '.github/workflows/pages.yml').read_text()
        self.assertIn('actions: read', workflow)
        self.assertIn('PAGES_ARTIFACT_ID: ${{ steps.upload.outputs.artifact_id }}', workflow)
        self.assertIn('id: upload', workflow)
        self.assertIn('python3 scripts/test-pages-bundle.py', workflow)
        self.assertIn('python3 scripts/test-pages-exact-artifact.py', workflow)


if __name__ == '__main__': unittest.main()
