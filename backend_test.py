#!/usr/bin/env python3
"""
Backend API Testing for Auto Platform Admin Panel
Tests P3 features: Feature Flags, Experiments, Auto-Suggested Actions, Reputation Control
"""

import requests
import json
import sys
from datetime import datetime

class AdminAPITester:
    def __init__(self, base_url="https://governance-layer-7.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    resp_data = response.json()
                    if isinstance(resp_data, dict) and len(str(resp_data)) < 200:
                        print(f"   Response: {resp_data}")
                except:
                    pass
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")

            return success, response.json() if response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            201,  # Backend returns 201 for login
            data={"email": "admin@autoservice.com", "password": "Admin123!"}
        )
        if success and 'accessToken' in response:
            self.token = response['accessToken']
            print(f"   ✅ Token obtained: {self.token[:20]}...")
            return True
        elif success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   ✅ Token obtained: {self.token[:20]}...")
            return True
        elif success and 'token' in response:
            self.token = response['token']
            print(f"   ✅ Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        return self.run_test(
            "Dashboard Stats",
            "GET",
            "api/admin/dashboard",
            200
        )[0]

    def test_feature_flags(self):
        """Test Feature Flags functionality"""
        print("\n🚩 Testing Feature Flags APIs...")
        
        # Test get feature flags (should show 4 seeded flags)
        success1, response1 = self.run_test(
            "Get Feature Flags",
            "GET",
            "api/admin/feature-flags",
            200
        )
        
        if success1 and response1:
            flags = response1.get('flags', [])
            print(f"   Found {len(flags)} feature flags")
            if len(flags) >= 4:
                print("   ✅ Expected 4+ seeded flags found")
            else:
                print(f"   ⚠️  Expected 4+ flags, found {len(flags)}")
        
        # Test create feature flag
        flag_data = {
            "key": f"test_flag_{int(datetime.now().timestamp())}",
            "name": "Test Feature Flag",
            "description": "Test flag for API testing",
            "enabled": False,
            "rollout": 50,
            "type": "release"
        }
        success2, _ = self.run_test(
            "Create Feature Flag",
            "POST",
            "api/admin/feature-flags",
            201,
            data=flag_data
        )
        
        # Test toggle feature flag (if we have flags)
        success3 = True
        if success1 and response1 and response1.get('flags'):
            first_flag = response1['flags'][0]
            flag_key = first_flag.get('key')
            current_enabled = first_flag.get('enabled', False)
            
            if flag_key:
                success3, _ = self.run_test(
                    f"Toggle Feature Flag - {flag_key}",
                    "POST",
                    f"api/admin/feature-flags/{flag_key}/toggle",
                    201,
                    data={"enabled": not current_enabled}
                )
        
        return success1 and success2 and success3

    def test_experiments(self):
        """Test Experiments functionality"""
        print("\n🧪 Testing Experiments APIs...")
        
        # Test get experiments (should show empty state initially)
        success1, response1 = self.run_test(
            "Get Experiments",
            "GET",
            "api/admin/experiments",
            200
        )
        
        if success1 and response1:
            experiments = response1.get('experiments', [])
            print(f"   Found {len(experiments)} experiments")
        
        # Test create experiment
        experiment_data = {
            "name": f"Test Experiment {int(datetime.now().timestamp())}",
            "description": "Test A/B experiment",
            "featureFlagKey": "test_flag",
            "variants": [
                {"id": "control", "name": "Control", "config": {}, "weight": 50},
                {"id": "variant_a", "name": "Variant A", "config": {}, "weight": 50}
            ],
            "metric": "conversion_rate"
        }
        success2, response2 = self.run_test(
            "Create Experiment",
            "POST",
            "api/admin/experiments",
            201,
            data=experiment_data
        )
        
        # Test update experiment status (if created successfully)
        success3 = True
        if success2 and response2 and response2.get('id'):
            exp_id = response2['id']
            success3, _ = self.run_test(
                "Update Experiment Status",
                "PATCH",
                f"api/admin/experiments/{exp_id}/status",
                200,
                data={"status": "active"}
            )
        
        return success1 and success2 and success3

    def test_auto_suggestions(self):
        """Test Auto-Suggested Actions functionality"""
        print("\n💡 Testing Auto-Suggested Actions APIs...")
        
        # Test get suggestions
        success1, response1 = self.run_test(
            "Get Smart Suggestions",
            "GET",
            "api/admin/suggestions",
            200
        )
        
        if success1 and response1:
            suggestions = response1.get('suggestions', [])
            print(f"   Found {len(suggestions)} suggestions")
            
            # Check for different severity levels
            critical = len([s for s in suggestions if s.get('severity') == 'critical'])
            warning = len([s for s in suggestions if s.get('severity') == 'warning'])
            info = len([s for s in suggestions if s.get('severity') == 'info'])
            print(f"   Critical: {critical}, Warning: {warning}, Info: {info}")
        
        # Test execute suggestion action (if we have suggestions)
        success2 = True
        if success1 and response1 and response1.get('suggestions'):
            suggestions = response1['suggestions']
            if suggestions:
                suggestion = suggestions[0]
                suggestion_id = suggestion.get('id')
                actions = suggestion.get('actions', [])
                
                if suggestion_id and actions:
                    action_id = actions[0].get('id')
                    success2, _ = self.run_test(
                        f"Execute Suggestion Action",
                        "POST",
                        f"api/admin/suggestions/{suggestion_id}/execute",
                        200,
                        data={"actionId": action_id}
                    )
        
        return success1 and success2

    def test_reputation_control(self):
        """Test Reputation Control functionality"""
        print("\n🛡️ Testing Reputation Control APIs...")
        
        # First, get organizations to find a provider ID
        success0, orgs_response = self.run_test(
            "Get Organizations for Reputation Test",
            "GET",
            "api/admin/organizations?limit=1",
            200
        )
        
        provider_id = None
        if success0 and orgs_response and orgs_response.get('organizations'):
            orgs = orgs_response['organizations']
            if orgs:
                provider_id = orgs[0].get('_id') or orgs[0].get('id')
        
        if not provider_id:
            print("   ⚠️  No provider found for reputation testing")
            return True  # Skip but don't fail
        
        # Test get provider reputation
        success1, response1 = self.run_test(
            "Get Provider Reputation",
            "GET",
            f"api/admin/providers/{provider_id}/reputation",
            200
        )
        
        if success1 and response1:
            provider = response1.get('provider', {})
            reviews = response1.get('reviews', [])
            history = response1.get('reputationHistory', [])
            print(f"   Provider: {provider.get('name', 'Unknown')}")
            print(f"   Reviews: {len(reviews)}, History: {len(history)}")
        
        # Test adjust provider rating
        rating_data = {
            "newRating": 4.2,
            "reason": "Test rating adjustment for API testing"
        }
        success2, _ = self.run_test(
            "Adjust Provider Rating",
            "POST",
            f"api/admin/providers/{provider_id}/reputation/rating",
            201,
            data=rating_data
        )
        
        # Test add trust flag
        success3, _ = self.run_test(
            "Add Trust Flag",
            "POST",
            f"api/admin/providers/{provider_id}/reputation/trust-flag",
            201,
            data={"flag": "verified_documents"}
        )
        
        # Test penalize provider
        penalty_data = {
            "type": "warning",
            "severity": 10,
            "reason": "Test penalty for API testing"
        }
        success4, _ = self.run_test(
            "Penalize Provider",
            "POST",
            f"api/admin/providers/{provider_id}/reputation/penalize",
            201,
            data=penalty_data
        )
        
        return success1 and success2 and success3 and success4

def main():
    print("🚀 Starting Auto Platform Admin Panel API Tests - P3 Features")
    print("=" * 70)
    
    tester = AdminAPITester()
    
    # Test login first
    if not tester.test_admin_login():
        print("\n❌ Admin login failed, stopping tests")
        return 1
    
    # Test P3 features
    tests = [
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("Feature Flags APIs", tester.test_feature_flags),
        ("Experiments APIs", tester.test_experiments),
        ("Auto-Suggested Actions APIs", tester.test_auto_suggestions),
        ("Reputation Control APIs", tester.test_reputation_control),
    ]
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            tester.failed_tests.append(f"{test_name}: {e}")
    
    # Print results
    print(f"\n{'='*70}")
    print(f"📊 Test Results:")
    print(f"   Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"   Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed tests:")
        for failed in tester.failed_tests:
            print(f"   - {failed}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())