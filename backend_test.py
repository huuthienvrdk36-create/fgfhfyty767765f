#!/usr/bin/env python3
"""
Backend API Testing for Auto Platform Admin Panel
Tests P1 features: Audit Log, Global Search, Notifications, Reports & Export
"""

import requests
import json
import sys
from datetime import datetime

class AdminAPITester:
    def __init__(self, base_url="https://ea289e00-5505-4b34-be10-0837cfce4f8a.preview.emergentagent.com"):
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

    def test_audit_log(self):
        """Test audit log endpoints"""
        print("\n📋 Testing Audit Log APIs...")
        
        # Test basic audit log
        success1, _ = self.run_test(
            "Get Audit Log",
            "GET",
            "api/admin/audit-log?limit=5",
            200
        )
        
        # Test with filters
        success2, _ = self.run_test(
            "Get Audit Log with Actor Filter",
            "GET",
            "api/admin/audit-log?actor=ADMIN&limit=3",
            200
        )
        
        # Test with entity type filter
        success3, _ = self.run_test(
            "Get Audit Log with Entity Filter",
            "GET",
            "api/admin/audit-log?entityType=user&limit=3",
            200
        )
        
        return success1 and success2 and success3

    def test_global_search(self):
        """Test global search functionality"""
        print("\n🔍 Testing Global Search APIs...")
        
        # Test search with BMW (as mentioned in requirements)
        success1, response1 = self.run_test(
            "Global Search - BMW",
            "GET",
            "api/admin/search?q=BMW",
            200
        )
        
        # Test search with admin
        success2, _ = self.run_test(
            "Global Search - admin",
            "GET",
            "api/admin/search?q=admin",
            200
        )
        
        # Test empty search
        success3, _ = self.run_test(
            "Global Search - empty",
            "GET",
            "api/admin/search?q=",
            200
        )
        
        return success1 and success2 and success3

    def test_notifications_admin(self):
        """Test notifications admin functionality"""
        print("\n🔔 Testing Notifications Admin APIs...")
        
        # Test get templates
        success1, _ = self.run_test(
            "Get Notification Templates",
            "GET",
            "api/admin/notifications/templates",
            200
        )
        
        # Test get bulk notifications history
        success2, _ = self.run_test(
            "Get Bulk Notifications History",
            "GET",
            "api/admin/notifications/history?limit=5",
            200
        )
        
        # Test create template
        template_data = {
            "code": "test_template_" + str(int(datetime.now().timestamp())),
            "title": "Test Template",
            "message": "This is a test notification template",
            "category": "system",
            "channels": ["push"]
        }
        success3, _ = self.run_test(
            "Create Notification Template",
            "POST",
            "api/admin/notifications/templates",
            201,  # POST operations return 201
            data=template_data
        )
        
        # Test bulk notification send
        bulk_data = {
            "title": "Test Bulk Notification",
            "message": "This is a test bulk notification",
            "filters": {
                "roles": ["provider_owner"],
                "tiers": ["bronze"]
            },
            "channels": ["push"]
        }
        success4, _ = self.run_test(
            "Send Bulk Notification",
            "POST",
            "api/admin/notifications/bulk",
            201,  # POST operations return 201
            data=bulk_data
        )
        
        return success1 and success2 and success3 and success4

    def test_reports_and_export(self):
        """Test reports and export functionality"""
        print("\n📊 Testing Reports & Export APIs...")
        
        # Test KPIs report
        success1, _ = self.run_test(
            "Get KPIs Report",
            "GET",
            "api/admin/reports/kpis",
            200
        )
        
        # Test Revenue report
        success2, _ = self.run_test(
            "Get Revenue Report",
            "GET",
            "api/admin/reports/revenue",
            200
        )
        
        # Test Bookings report
        success3, _ = self.run_test(
            "Get Bookings Report",
            "GET",
            "api/admin/reports/bookings",
            200
        )
        
        # Test Providers report
        success4, _ = self.run_test(
            "Get Providers Report",
            "GET",
            "api/admin/reports/providers",
            200
        )
        
        # Test Conversion report
        success5, _ = self.run_test(
            "Get Conversion Report",
            "GET",
            "api/admin/reports/conversion",
            200
        )
        
        # Test CSV Export - Users
        success6, _ = self.run_test(
            "Export Users CSV",
            "GET",
            "api/admin/export/users",
            200
        )
        
        # Test CSV Export - Organizations
        success7, _ = self.run_test(
            "Export Organizations CSV",
            "GET",
            "api/admin/export/organizations",
            200
        )
        
        return success1 and success2 and success3 and success4 and success5 and success6 and success7

    def test_additional_admin_apis(self):
        """Test additional admin APIs"""
        print("\n🔧 Testing Additional Admin APIs...")
        
        # Test get users
        success1, _ = self.run_test(
            "Get Users",
            "GET",
            "api/admin/users?limit=5",
            200
        )
        
        # Test get organizations
        success2, _ = self.run_test(
            "Get Organizations",
            "GET",
            "api/admin/organizations?limit=5",
            200
        )
        
        # Test get bookings
        success3, _ = self.run_test(
            "Get Bookings",
            "GET",
            "api/admin/bookings?limit=5",
            200
        )
        
        return success1 and success2 and success3

def main():
    print("🚀 Starting Auto Platform Admin Panel API Tests")
    print("=" * 60)
    
    tester = AdminAPITester()
    
    # Test login first
    if not tester.test_admin_login():
        print("\n❌ Admin login failed, stopping tests")
        return 1
    
    # Test all P1 features
    tests = [
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("Audit Log APIs", tester.test_audit_log),
        ("Global Search APIs", tester.test_global_search),
        ("Notifications Admin APIs", tester.test_notifications_admin),
        ("Reports & Export APIs", tester.test_reports_and_export),
        ("Additional Admin APIs", tester.test_additional_admin_apis),
    ]
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            tester.failed_tests.append(f"{test_name}: {e}")
    
    # Print results
    print(f"\n{'='*60}")
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