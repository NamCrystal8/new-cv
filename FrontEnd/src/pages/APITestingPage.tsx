import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { Switch } from '@/components/ui/switch';
import {
  Code,
  Send,
  User,
  Shield,
  FileText,
  Crown,
  Activity,
  Settings,
  Bug,
  Home,
  Copy,
  Play,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { getApiBaseUrl } from '@/utils/api';
import { getAuthToken } from '@/utils/tokenAuth';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  parameters?: Array<{
    name: string;
    type: 'string' | 'number' | 'file' | 'json' | 'boolean';
    required?: boolean;
    description?: string;
  }>;
  bodyType?: 'json' | 'formdata' | 'none';
}

interface ApiResponse {
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
  timestamp: string;
}

interface BulkTestItem {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  endpoint: string;
  expectedStatus: number;
  actualStatus?: number;
  expectedResponse?: string;
  actualResponse?: any;
  testStatus: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
  failureReason?: string;
  enabled: boolean;
  requiresAuth?: boolean;
  bodyType?: 'json' | 'formdata' | 'none';
  requestBody?: string;
  parameters?: Record<string, any>;
  category: string;
}

interface TestCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  tests: BulkTestItem[];
  expanded: boolean;
}



interface BulkTestResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  startTime: string;
  endTime?: string;
  duration?: number;
}

const APITestingPage: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [requestBody, setRequestBody] = useState<string>('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string>('');
  const [manualJwtToken, setManualJwtToken] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk testing state
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [testCategories, setTestCategories] = useState<TestCategory[]>([]);
  const [bulkTestResults, setBulkTestResults] = useState<BulkTestResults | null>(null);
  const [bulkTestRunning, setBulkTestRunning] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState<number>(-1);
  const [currentCategory, setCurrentCategory] = useState<string>('');


  // Initialize test categories with organized test suites
  const initializeTestCategories = (): TestCategory[] => {
    return [
      {
        id: 'authentication',
        name: 'Xác Thực (Authentication)',
        icon: User,
        description: 'Các API xác thực chính được sử dụng bởi ứng dụng frontend',
        expanded: true,
        tests: [
          {
            id: 'auth-1',
            name: 'Đăng Nhập Thành Công (Cookie)',
            method: 'POST',
            endpoint: '/auth/jwt/login',
            expectedStatus: 204,
            testStatus: 'PENDING',
            enabled: true,
            bodyType: 'formdata',
            requestBody: 'username=admin@cvbuilder.com&password=admin123',
            expectedResponse: '',
            category: 'authentication'
          },
          {
            id: 'auth-2',
            name: 'Đăng Nhập Thành Công (Bearer Token)',
            method: 'POST',
            endpoint: '/auth/bearer/login',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            bodyType: 'formdata',
            requestBody: 'username=admin@cvbuilder.com&password=admin123',
            expectedResponse: '{"access_token": "...", "token_type": "bearer"}',
            category: 'authentication'
          },
          {
            id: 'auth-3',
            name: 'Lấy Thông Tin User (Đã Đăng Nhập)',
            method: 'GET',
            endpoint: '/users/me',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '{"id": "...", "email": "admin@cvbuilder.com", "is_active": true}',
            category: 'authentication'
          },
          {
            id: 'auth-4',
            name: 'Lấy Thông Tin User (Có Session)',
            method: 'GET',
            endpoint: '/users/me',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: false,
            expectedResponse: '{"id": "...", "email": "...", "is_active": true}',
            category: 'authentication'
          },
          {
            id: 'auth-5',
            name: 'Đăng Ký Tài Khoản (Dữ Liệu Hợp Lệ)',
            method: 'POST',
            endpoint: '/auth/register',
            expectedStatus: 201,
            testStatus: 'PENDING',
            enabled: true,
            bodyType: 'json',
            requestBody: '{"email": "testuser@example.com", "password": "securePassword123", "is_active": true, "is_superuser": false, "is_verified": false}',
            expectedResponse: '{"id": "...", "email": "...", "is_active": true}',
            category: 'authentication'
          },
          {
            id: 'auth-6',
            name: 'Đăng Ký - Email Không Hợp Lệ',
            method: 'POST',
            endpoint: '/auth/register',
            expectedStatus: 422,
            testStatus: 'PENDING',
            enabled: true,
            bodyType: 'json',
            requestBody: '{"email": "invalid-email", "password": "securePassword123", "is_active": true, "is_superuser": false, "is_verified": false}',
            expectedResponse: '{"detail": [...]}',
            category: 'authentication'
          },
          {
            id: 'auth-7',
            name: 'Đăng Xuất (Cookie)',
            method: 'POST',
            endpoint: '/auth/jwt/logout',
            expectedStatus: 204,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'authentication'
          },
          {
            id: 'auth-8',
            name: 'Đăng Xuất (Bearer Token)',
            method: 'POST',
            endpoint: '/auth/bearer/logout',
            expectedStatus: 204,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'authentication'
          },
          {
            id: 'auth-9',
            name: 'Đăng Nhập - Sai Mật Khẩu',
            method: 'POST',
            endpoint: '/auth/jwt/login',
            expectedStatus: 400,
            testStatus: 'PENDING',
            enabled: true,
            bodyType: 'formdata',
            requestBody: 'username=admin@cvbuilder.com&password=saimatkhau123',
            expectedResponse: '{"detail": "LOGIN_BAD_CREDENTIALS"}',
            category: 'authentication'
          },
          {
            id: 'auth-10',
            name: 'Đăng Nhập - Không Có Email',
            method: 'POST',
            endpoint: '/auth/jwt/login',
            expectedStatus: 400,
            testStatus: 'PENDING',
            enabled: true,
            bodyType: 'formdata',
            requestBody: 'username=&password=admin123',
            expectedResponse: '{"detail": "LOGIN_BAD_CREDENTIALS"}',
            category: 'authentication'
          },
          {
            id: 'auth-11',
            name: 'Đăng Nhập - Không Có Mật Khẩu',
            method: 'POST',
            endpoint: '/auth/jwt/login',
            expectedStatus: 400,
            testStatus: 'PENDING',
            enabled: true,
            bodyType: 'formdata',
            requestBody: 'username=admin@cvbuilder.com&password=',
            expectedResponse: '{"detail": "LOGIN_BAD_CREDENTIALS"}',
            category: 'authentication'
          },
          {
            id: 'auth-12',
            name: 'Đăng Ký - Mật Khẩu Quá Yếu',
            method: 'POST',
            endpoint: '/auth/register',
            expectedStatus: 400,
            testStatus: 'PENDING',
            enabled: true,
            bodyType: 'json',
            requestBody: '{"email": "test@example.com", "password": "123", "is_active": true, "is_superuser": false, "is_verified": false}',
            expectedResponse: '{"detail": "Password validation error"}',
            category: 'authentication'
          },
          {
            id: 'auth-13',
            name: 'Đăng Ký - Email Đã Tồn Tại',
            method: 'POST',
            endpoint: '/auth/register',
            expectedStatus: 400,
            testStatus: 'PENDING',
            enabled: true,
            bodyType: 'json',
            requestBody: '{"email": "admin@cvbuilder.com", "password": "securePassword123", "is_active": true, "is_superuser": false, "is_verified": false}',
            expectedResponse: '{"detail": "REGISTER_USER_ALREADY_EXISTS"}',
            category: 'authentication'
          },
          {
            id: 'auth-14',
            name: 'Kiểm Tra Trạng Thái Xác Thực',
            method: 'GET',
            endpoint: '/debug/auth-status',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: false,
            expectedResponse: '{"has_auth_header": false, "has_auth_cookies": true}',
            category: 'authentication'
          }
        ]
      },
      {
        id: 'basic-endpoints',
        name: 'Endpoints Cơ Bản',
        icon: Home,
        description: 'Các endpoint công khai hoạt động mà không cần xác thực',
        expanded: false,
        tests: [
          {
            id: 'basic-1',
            name: 'Trang Chủ API',
            method: 'GET',
            endpoint: '/',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            expectedResponse: '',
            category: 'basic-endpoints'
          },
          {
            id: 'basic-2',
            name: 'Thông Tin Ứng Dụng',
            method: 'GET',
            endpoint: '/about',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            expectedResponse: '',
            category: 'basic-endpoints'
          },
          {
            id: 'basic-3',
            name: 'Lấy Danh Sách Tin Nhắn',
            method: 'GET',
            endpoint: '/messages',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            expectedResponse: '',
            category: 'basic-endpoints'
          }
        ]
      },
      {
        id: 'cv-operations',
        name: 'CV CRUD Operations',
        icon: FileText,
        description: 'User CV CRUD operations - Create, Read, Update, Delete (success scenarios)',
        expanded: false,
        tests: [
          // READ Operations
          {
            id: 'cv-1',
            name: 'Lấy Danh Sách CV (Read All)',
            method: 'GET',
            endpoint: '/user-cvs',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'cv-operations'
          },
          {
            id: 'cv-2',
            name: 'Lấy CV Cụ Thể (Read One)',
            method: 'GET',
            endpoint: '/cv/1',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'cv-operations'
          },
          {
            id: 'cv-3',
            name: 'Lấy CV Không Tồn Tại (Read 404)',
            method: 'GET',
            endpoint: '/cv/999999',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'cv-operations'
          },
          // UPDATE Operations
          {
            id: 'cv-4',
            name: 'Cập Nhật CV (Update)',
            method: 'POST',
            endpoint: '/cv/1/update',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            bodyType: 'json',
            requestBody: '{"flow_id": "test-flow", "additional_inputs": {"name": "Updated Name"}}',
            expectedResponse: '',
            category: 'cv-operations'
          },
          // CREATE Operations (via file upload)
          {
            id: 'cv-5',
            name: 'Phân Tích CV (Create Analysis)',
            method: 'POST',
            endpoint: '/analyze-cv-weaknesses',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'cv-operations'
          },
          {
            id: 'cv-6',
            name: 'Phân Tích CV Với Job Description',
            method: 'POST',
            endpoint: '/analyze-cv-with-job-description',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'cv-operations'
          },
          // Flow Operations
          {
            id: 'cv-7',
            name: 'Kiểm Tra CV Flow Status',
            method: 'GET',
            endpoint: '/cv-flow-status/test-flow-id',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'cv-operations'
          },
          {
            id: 'cv-8',
            name: 'Hoàn Thành CV Flow',
            method: 'POST',
            endpoint: '/complete-cv-flow/test-flow-id',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            bodyType: 'json',
            requestBody: '{"additional_inputs": {"name": "Test User", "email": "test@example.com"}}',
            expectedResponse: '',
            category: 'cv-operations'
          }
        ]
      },
      {
        id: 'subscription',
        name: 'Quản Lý Gói Đăng Ký',
        icon: Crown,
        description: 'Các gói đăng ký và subscription (chỉ test success scenarios)',
        expanded: false,
        tests: [
          {
            id: 'sub-1',
            name: 'Lấy Danh Sách Gói Đăng Ký',
            method: 'GET',
            endpoint: '/subscription/plans',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            expectedResponse: '',
            category: 'subscription'
          },
          {
            id: 'sub-2',
            name: 'Lấy Subscription Hiện Tại',
            method: 'GET',
            endpoint: '/subscription/current',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'subscription'
          },
          {
            id: 'sub-3',
            name: 'Lấy Usage Statistics',
            method: 'GET',
            endpoint: '/subscription/usage',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'subscription'
          },
          {
            id: 'sub-4',
            name: 'Lấy Subscription Status',
            method: 'GET',
            endpoint: '/subscription/status',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'subscription'
          },
          {
            id: 'sub-5',
            name: 'Kiểm Tra Usage Limits',
            method: 'POST',
            endpoint: '/subscription/check-limits/cv_analysis',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'subscription'
          }
        ]
      },
      {
        id: 'admin',
        name: 'Quản Lý Admin',
        icon: Shield,
        description: 'Các chức năng quản trị và điều hành (chỉ test success scenarios)',
        expanded: false,
        tests: [
          {
            id: 'admin-1',
            name: 'Admin Dashboard',
            method: 'GET',
            endpoint: '/admin/dashboard',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'admin'
          },
          {
            id: 'admin-2',
            name: 'Lấy Danh Sách Users',
            method: 'GET',
            endpoint: '/admin/users',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'admin'
          },
          {
            id: 'admin-3',
            name: 'Lấy Danh Sách Subscriptions',
            method: 'GET',
            endpoint: '/admin/subscriptions',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'admin'
          },
          {
            id: 'admin-4',
            name: 'Admin Health Check',
            method: 'GET',
            endpoint: '/admin/health',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'admin'
          }
        ]
      },
      {
        id: 'admin-cv-crud',
        name: 'Admin CV CRUD',
        icon: FileText,
        description: 'Admin CV management operations (CRUD)',
        expanded: false,
        tests: [
          {
            id: 'admin-cv-1',
            name: 'Admin - Lấy Danh Sách CVs (Read All)',
            method: 'GET',
            endpoint: '/admin/cvs',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'admin-cv-crud'
          },
          {
            id: 'admin-cv-2',
            name: 'Admin - Lấy CV Cụ Thể (Read One)',
            method: 'GET',
            endpoint: '/admin/cvs/1',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'admin-cv-crud'
          },
          {
            id: 'admin-cv-3',
            name: 'Admin - Lấy CV Không Tồn Tại (Read 404)',
            method: 'GET',
            endpoint: '/admin/cvs/999999',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'admin-cv-crud'
          },
          {
            id: 'admin-cv-4',
            name: 'Admin - Xóa CV (Delete)',
            method: 'DELETE',
            endpoint: '/admin/cvs/999999',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'admin-cv-crud'
          },
          {
            id: 'admin-cv-5',
            name: 'Admin - Tìm Kiếm CVs',
            method: 'GET',
            endpoint: '/admin/cvs?search=test@example.com&page=1&page_size=10',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            requiresAuth: true,
            expectedResponse: '',
            category: 'admin-cv-crud'
          }
        ]
      },
      {
        id: 'system',
        name: 'System & Health',
        icon: Activity,
        description: 'Health checks, setup, and system status',
        expanded: false,
        tests: [
          {
            id: 'sys-1',
            name: 'Health Check',
            method: 'GET',
            endpoint: '/health',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            expectedResponse: '',
            category: 'system'
          },
          {
            id: 'sys-2',
            name: 'Database Debug',
            method: 'GET',
            endpoint: '/debug/database',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            expectedResponse: '',
            category: 'system'
          },
          {
            id: 'sys-3',
            name: 'Setup Status',
            method: 'GET',
            endpoint: '/setup/status',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            expectedResponse: '',
            category: 'system'
          },
          {
            id: 'sys-4',
            name: 'Auth Status Debug',
            method: 'GET',
            endpoint: '/debug/auth-status',
            expectedStatus: 200,
            testStatus: 'PENDING',
            enabled: true,
            expectedResponse: '',
            category: 'system'
          }
        ]
      }
    ];
  };

  // Initialize test categories on component mount
  React.useEffect(() => {
    if (testCategories.length === 0) {
      setTestCategories(initializeTestCategories());
    }
  }, []);

  // Sample JSON data for different endpoints
  const getSampleJson = (endpoint: ApiEndpoint): string => {
    switch (endpoint.path) {
      case '/auth/register':
        return JSON.stringify({
          email: "test@example.com",
          password: "password123"
        }, null, 2);
      case '/auth/forgot-password':
        return JSON.stringify({
          email: "test@example.com"
        }, null, 2);
      case '/users/me':
        return JSON.stringify({
          email: "newemail@example.com"
        }, null, 2);
      case '/cv/analyze-weakness':
        return JSON.stringify({
          cv_data: {
            personal_info: {
              name: "John Doe",
              email: "john@example.com"
            },
            skills: ["JavaScript", "Python"],
            experience: []
          }
        }, null, 2);
      case '/cv/enhance':
        return JSON.stringify({
          cv_data: {
            personal_info: {
              name: "John Doe",
              email: "john@example.com"
            },
            skills: ["JavaScript", "Python"],
            experience: []
          }
        }, null, 2);
      case '/subscription/upgrade':
        return JSON.stringify({
          plan_id: 2
        }, null, 2);
      default:
        return JSON.stringify({
          // Add your data here
        }, null, 2);
    }
  };

  // API Endpoints organized by category
  const apiEndpoints: Record<string, ApiEndpoint[]> = {
    'Base Routes': [
      {
        method: 'GET',
        path: '/',
        description: 'Root endpoint - Hello message'
      },
      {
        method: 'GET',
        path: '/about',
        description: 'About page information'
      },
      {
        method: 'POST',
        path: '/messages/{msg_name}',
        description: 'Add a new message',
        parameters: [
          { name: 'msg_name', type: 'string', required: true, description: 'Message name' }
        ]
      },
      {
        method: 'GET',
        path: '/messages',
        description: 'Get all messages'
      }
    ],
    'Authentication': [
      {
        method: 'POST',
        path: '/auth/jwt/login',
        description: 'Login with cookie-based authentication',
        bodyType: 'formdata',
        parameters: [
          { name: 'username', type: 'string', required: true, description: 'Email address' },
          { name: 'password', type: 'string', required: true, description: 'Password' }
        ]
      },
      {
        method: 'POST',
        path: '/auth/bearer/login',
        description: 'Login with bearer token authentication',
        bodyType: 'formdata',
        parameters: [
          { name: 'username', type: 'string', required: true, description: 'Email address' },
          { name: 'password', type: 'string', required: true, description: 'Password' }
        ]
      },
      {
        method: 'POST',
        path: '/auth/register',
        description: 'Register a new user',
        bodyType: 'json',
        parameters: [
          { name: 'email', type: 'string', required: true, description: 'Email address' },
          { name: 'password', type: 'string', required: true, description: 'Password' }
        ]
      },
      {
        method: 'POST',
        path: '/auth/logout',
        description: 'Logout current user',
        requiresAuth: true
      },
      {
        method: 'POST',
        path: '/auth/forgot-password',
        description: 'Request password reset',
        bodyType: 'json',
        parameters: [
          { name: 'email', type: 'string', required: true, description: 'Email address' }
        ]
      }
    ],
    'User Management': [
      {
        method: 'GET',
        path: '/users/me',
        description: 'Get current user information',
        requiresAuth: true
      },
      {
        method: 'PATCH',
        path: '/users/me',
        description: 'Update current user',
        requiresAuth: true,
        bodyType: 'json',
        parameters: [
          { name: 'email', type: 'string', description: 'New email address' }
        ]
      }
    ],
    'CV Operations': [
      {
        method: 'POST',
        path: '/extract-pdf',
        description: 'Extract text from PDF file',
        bodyType: 'formdata',
        parameters: [
          { name: 'file', type: 'file', required: true, description: 'PDF file to extract text from' }
        ]
      },
      {
        method: 'POST',
        path: '/convert-to-latex/',
        description: 'Convert CV data to LaTeX',
        bodyType: 'json',
        parameters: [
          { name: 'data', type: 'json', required: true, description: 'CV data object' }
        ]
      },
      {
        method: 'GET',
        path: '/pdf/{filename}',
        description: 'Get PDF file by filename',
        parameters: [
          { name: 'filename', type: 'string', required: true, description: 'PDF filename' }
        ]
      },
      {
        method: 'POST',
        path: '/convert-tex-to-pdf/{filename}',
        description: 'Convert TeX file to PDF',
        parameters: [
          { name: 'filename', type: 'string', required: true, description: 'TeX filename' }
        ]
      },
      {
        method: 'POST',
        path: '/cv/analyze-weakness',
        description: 'Analyze CV weaknesses',
        requiresAuth: true,
        bodyType: 'json',
        parameters: [
          { name: 'cv_data', type: 'json', required: true, description: 'CV data to analyze' }
        ]
      },
      {
        method: 'POST',
        path: '/cv/enhance',
        description: 'Enhance CV with AI recommendations',
        requiresAuth: true,
        bodyType: 'json',
        parameters: [
          { name: 'cv_data', type: 'json', required: true, description: 'CV data to enhance' }
        ]
      },
      {
        method: 'POST',
        path: '/cv/complete-flow/{flow_id}',
        description: 'Complete CV enhancement flow',
        requiresAuth: true,
        bodyType: 'json',
        parameters: [
          { name: 'flow_id', type: 'string', required: true, description: 'Flow ID' },
          { name: 'cv_data', type: 'json', required: true, description: 'Final CV data' }
        ]
      },
      {
        method: 'GET',
        path: '/cv/user-cvs',
        description: 'Get user CVs',
        requiresAuth: true
      },
      {
        method: 'GET',
        path: '/cv/{cv_id}',
        description: 'Get specific CV by ID',
        requiresAuth: true,
        parameters: [
          { name: 'cv_id', type: 'number', required: true, description: 'CV ID' }
        ]
      },
      {
        method: 'POST',
        path: '/cv/regenerate/{cv_id}',
        description: 'Regenerate CV from stored data',
        requiresAuth: true,
        parameters: [
          { name: 'cv_id', type: 'number', required: true, description: 'CV ID to regenerate' }
        ]
      }
    ],
    'Subscription': [
      {
        method: 'GET',
        path: '/subscription/plans',
        description: 'Get all subscription plans'
      },
      {
        method: 'GET',
        path: '/subscription/my-subscription',
        description: 'Get current user subscription',
        requiresAuth: true
      },
      {
        method: 'POST',
        path: '/subscription/upgrade',
        description: 'Upgrade user subscription',
        requiresAuth: true,
        bodyType: 'json',
        parameters: [
          { name: 'plan_id', type: 'number', required: true, description: 'Target plan ID' }
        ]
      },
      {
        method: 'GET',
        path: '/subscription/usage-stats',
        description: 'Get usage statistics',
        requiresAuth: true
      },
      {
        method: 'GET',
        path: '/subscription/analytics',
        description: 'Get subscription analytics',
        requiresAuth: true
      }
    ],
    'Admin Routes': [
      {
        method: 'GET',
        path: '/admin/dashboard',
        description: 'Get admin dashboard metrics',
        requiresAuth: true,
        requiresAdmin: true
      },
      {
        method: 'GET',
        path: '/admin/users',
        description: 'Get users (paginated)',
        requiresAuth: true,
        requiresAdmin: true,
        parameters: [
          { name: 'search', type: 'string', description: 'Search term' },
          { name: 'status', type: 'string', description: 'User status filter' },
          { name: 'page', type: 'number', description: 'Page number (default: 1)' },
          { name: 'page_size', type: 'number', description: 'Items per page (default: 20)' }
        ]
      },
      {
        method: 'PATCH',
        path: '/admin/users/{user_id}',
        description: 'Update user (admin)',
        requiresAuth: true,
        requiresAdmin: true,
        bodyType: 'json',
        parameters: [
          { name: 'user_id', type: 'string', required: true, description: 'User ID to update' }
        ]
      },
      {
        method: 'GET',
        path: '/admin/cvs',
        description: 'Get CVs (paginated)',
        requiresAuth: true,
        requiresAdmin: true,
        parameters: [
          { name: 'search', type: 'string', description: 'Search in owner email' },
          { name: 'status', type: 'string', description: 'CV status filter' },
          { name: 'page', type: 'number', description: 'Page number' },
          { name: 'page_size', type: 'number', description: 'Items per page' }
        ]
      },
      {
        method: 'GET',
        path: '/admin/subscriptions',
        description: 'Get subscriptions (paginated)',
        requiresAuth: true,
        requiresAdmin: true,
        parameters: [
          { name: 'search', type: 'string', description: 'Search term' },
          { name: 'plan_id', type: 'number', description: 'Filter by plan ID' },
          { name: 'page', type: 'number', description: 'Page number' },
          { name: 'page_size', type: 'number', description: 'Items per page' }
        ]
      },
      {
        method: 'GET',
        path: '/admin/plans',
        description: 'Get subscription plans (admin)',
        requiresAuth: true,
        requiresAdmin: true
      },
      {
        method: 'POST',
        path: '/admin/plans',
        description: 'Create subscription plan',
        requiresAuth: true,
        requiresAdmin: true,
        bodyType: 'json',
        parameters: [
          { name: 'name', type: 'string', required: true, description: 'Plan name' },
          { name: 'price_monthly', type: 'number', required: true, description: 'Monthly price' },
          { name: 'cv_limit', type: 'number', required: true, description: 'CV limit' }
        ]
      },
      {
        method: 'PATCH',
        path: '/admin/plans/{plan_id}',
        description: 'Update subscription plan',
        requiresAuth: true,
        requiresAdmin: true,
        bodyType: 'json',
        parameters: [
          { name: 'plan_id', type: 'number', required: true, description: 'Plan ID to update' }
        ]
      }
    ],
    'Health & Setup': [
      {
        method: 'GET',
        path: '/health',
        description: 'Application health check'
      },
      {
        method: 'GET',
        path: '/debug/database',
        description: 'Database connectivity debug'
      },
      {
        method: 'POST',
        path: '/setup/create-admin',
        description: 'Create admin user (setup)'
      },
      {
        method: 'GET',
        path: '/setup/status',
        description: 'Check application setup status'
      }
    ],
    'Debug Routes': [
      {
        method: 'GET',
        path: '/debug/auth-status',
        description: 'Check authentication status (debug)'
      },
      {
        method: 'GET',
        path: '/debug/protected-test',
        description: 'Test protected endpoint',
        requiresAuth: true
      },
      {
        method: 'GET',
        path: '/debug/auth-backends',
        description: 'Get authentication backends info'
      },
      {
        method: 'GET',
        path: '/debug/test-user-dependency',
        description: 'Test user dependency creation'
      },
      {
        method: 'GET',
        path: '/debug/manual-auth-test',
        description: 'Manual authentication test'
      }
    ]
  };

  const handleParameterChange = (name: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const buildUrl = (endpoint: ApiEndpoint): string => {
    let url = endpoint.path;
    
    // Replace path parameters
    Object.entries(parameters).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, encodeURIComponent(value));
    });
    
    return `${getApiBaseUrl()}${url}`;
  };

  const executeRequest = async () => {
    if (!selectedEndpoint) return;
    
    setLoading(true);
    setResponse(null);
    
    try {
      const url = buildUrl(selectedEndpoint);
      const headers: Record<string, string> = {};
      
      // Add authentication if required
      if (selectedEndpoint.requiresAuth || authToken) {
        const token = authToken || getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      let body: any = undefined;
      
      // Prepare request body
      if (selectedEndpoint.bodyType === 'json' && requestBody) {
        try {
          body = JSON.stringify(JSON.parse(requestBody));
          headers['Content-Type'] = 'application/json';
        } catch (e) {
          throw new Error('Invalid JSON in request body');
        }
      } else if (selectedEndpoint.bodyType === 'formdata') {
        const formData = new FormData();
        Object.entries(parameters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            formData.append(key, value);
          }
        });
        body = formData;
      }
      
      const fetchOptions: RequestInit = {
        method: selectedEndpoint.method,
        headers,
        mode: 'cors'
      };
      
      if (body) {
        fetchOptions.body = body;
      }
      
      const res = await fetch(url, fetchOptions);
      
      let responseData;
      const contentType = res.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        responseData = await res.json();
      } else {
        responseData = await res.text();
      }
      
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: responseData,
        headers: responseHeaders,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      setResponse({
        status: 0,
        statusText: 'Network Error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        headers: {},
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Generate random email and password for registration tests
  const generateRandomCredentials = () => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    const email = `testuser${timestamp}${randomNum}@example.com`;
    const password = `TestPass${timestamp}${randomNum}!`;
    return { email, password };
  };

  // Extract JWT token from login response
  const extractJwtFromResponse = (response: any): string | null => {
    if (typeof response === 'object' && response?.access_token) {
      return response.access_token;
    }
    return null;
  };

  // Execute a single bulk test
  const executeBulkTest = async (test: BulkTestItem): Promise<BulkTestItem> => {
    const updatedTest = { ...test, testStatus: 'RUNNING' as const };

    try {
      const url = `${getApiBaseUrl()}${test.endpoint}`;
      const headers: Record<string, string> = {};

      // Add authentication if required
      if (test.requiresAuth) {
        const token = manualJwtToken || authToken || getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      let body: any = undefined;
      let requestBody = test.requestBody;

      // Generate random credentials for registration tests
      if (test.endpoint === '/auth/register' && test.bodyType === 'json' && requestBody) {
        try {
          const bodyObj = JSON.parse(requestBody);
          if (bodyObj.email && bodyObj.email.includes('testuser')) {
            const { email, password } = generateRandomCredentials();
            bodyObj.email = email;
            bodyObj.password = password;
            requestBody = JSON.stringify(bodyObj);
          }
        } catch (e) {
          // If parsing fails, use original body
        }
      }

      // Prepare request body
      if (test.bodyType === 'json' && requestBody) {
        try {
          body = JSON.stringify(JSON.parse(requestBody));
          headers['Content-Type'] = 'application/json';
        } catch (e) {
          return {
            ...updatedTest,
            testStatus: 'FAILED',
            failureReason: 'Invalid JSON in request body'
          };
        }
      } else if (test.bodyType === 'formdata' && requestBody) {
        // Handle form data (for login endpoints)
        body = requestBody;
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      const fetchOptions: RequestInit = {
        method: test.method,
        headers,
        mode: 'cors'
      };

      if (body) {
        fetchOptions.body = body;
      }

      const res = await fetch(url, fetchOptions);

      let responseData;
      const contentType = res.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        responseData = await res.json();
      } else {
        responseData = await res.text();
      }

      // Check if test passed
      const statusMatch = res.status === test.expectedStatus;
      let responseMatch = true;
      let failureReason = '';

      if (!statusMatch) {
        failureReason = `Expected status ${test.expectedStatus}, got ${res.status}`;
      }

      // Basic response validation if expected response is provided
      if (test.expectedResponse && statusMatch) {
        try {
          const expectedData = JSON.parse(test.expectedResponse);
          if (typeof expectedData === 'object' && expectedData !== null) {
            // Check if response contains expected keys
            const expectedKeys = Object.keys(expectedData);
            const actualKeys = typeof responseData === 'object' ? Object.keys(responseData) : [];
            const missingKeys = expectedKeys.filter(key => !actualKeys.includes(key));

            if (missingKeys.length > 0) {
              responseMatch = false;
              failureReason = `Missing expected keys: ${missingKeys.join(', ')}`;
            }
          }
        } catch (e) {
          // If expected response is not valid JSON, just check if actual response contains the text
          if (typeof responseData === 'string' && !responseData.includes(test.expectedResponse)) {
            responseMatch = false;
            failureReason = 'Response does not contain expected text';
          }
        }
      }

      const testPassed = statusMatch && responseMatch;

      // Auto-extract JWT token from successful login responses
      if (testPassed && (test.endpoint === '/auth/bearer/login' || test.endpoint === '/auth/jwt/login')) {
        const token = extractJwtFromResponse(responseData);
        if (token && !manualJwtToken) {
          setManualJwtToken(token);
        }
      }

      return {
        ...updatedTest,
        actualStatus: res.status,
        actualResponse: responseData,
        testStatus: testPassed ? 'PASSED' : 'FAILED',
        failureReason: testPassed ? undefined : failureReason
      };

    } catch (error) {
      return {
        ...updatedTest,
        testStatus: 'FAILED',
        failureReason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Run all enabled tests across all categories
  const runAllTests = async () => {
    const allEnabledTests = testCategories.flatMap(category =>
      category.tests.filter(test => test.enabled)
    );
    if (allEnabledTests.length === 0) return;

    setBulkTestRunning(true);
    setCurrentTestIndex(0);
    setCurrentCategory('all');

    const startTime = new Date().toISOString();
    let passedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < allEnabledTests.length; i++) {
      setCurrentTestIndex(i);
      const test = allEnabledTests[i];

      const result = await executeBulkTest(test);

      // Update the test in the appropriate category
      setTestCategories(prev => prev.map(category => ({
        ...category,
        tests: category.tests.map(t => t.id === test.id ? result : t)
      })));

      if (result.testStatus === 'PASSED') {
        passedCount++;
      } else {
        failedCount++;
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    setBulkTestResults({
      totalTests: allEnabledTests.length,
      passedTests: passedCount,
      failedTests: failedCount,
      startTime,
      endTime,
      duration
    });

    setBulkTestRunning(false);
    setCurrentTestIndex(-1);
    setCurrentCategory('');
  };

  // Run tests for a specific category
  const runCategoryTests = async (categoryId: string) => {
    const category = testCategories.find(cat => cat.id === categoryId);
    if (!category) return;

    const enabledTests = category.tests.filter(test => test.enabled);
    if (enabledTests.length === 0) return;

    setBulkTestRunning(true);
    setCurrentTestIndex(0);
    setCurrentCategory(categoryId);

    for (let i = 0; i < enabledTests.length; i++) {
      setCurrentTestIndex(i);
      const test = enabledTests[i];

      const result = await executeBulkTest(test);

      // Update the test in the category
      setTestCategories(prev => prev.map(cat =>
        cat.id === categoryId ? {
          ...cat,
          tests: cat.tests.map(t => t.id === test.id ? result : t)
        } : cat
      ));

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setBulkTestRunning(false);
    setCurrentTestIndex(-1);
    setCurrentCategory('');
  };

  // Update test item in category
  const updateTest = (categoryId: string, testId: string, updates: Partial<BulkTestItem>) => {
    setTestCategories(prev => prev.map(category =>
      category.id === categoryId ? {
        ...category,
        tests: category.tests.map(test =>
          test.id === testId ? { ...test, ...updates } : test
        )
      } : category
    ));
  };

  // Remove test item from category
  const removeTest = (categoryId: string, testId: string) => {
    setTestCategories(prev => prev.map(category =>
      category.id === categoryId ? {
        ...category,
        tests: category.tests.filter(test => test.id !== testId)
      } : category
    ));
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setTestCategories(prev => prev.map(category =>
      category.id === categoryId ? {
        ...category,
        expanded: !category.expanded
      } : category
    ));
  };

  // Reset all test results
  const resetAllTests = () => {
    setTestCategories(prev => prev.map(category => ({
      ...category,
      tests: category.tests.map(test => ({
        ...test,
        testStatus: 'PENDING' as const,
        actualStatus: undefined,
        actualResponse: undefined,
        failureReason: undefined
      }))
    })));
    setBulkTestResults(null);
  };

  // Reset category test results
  const resetCategoryTests = (categoryId: string) => {
    setTestCategories(prev => prev.map(category =>
      category.id === categoryId ? {
        ...category,
        tests: category.tests.map(test => ({
          ...test,
          testStatus: 'PENDING' as const,
          actualStatus: undefined,
          actualResponse: undefined,
          failureReason: undefined
        }))
      } : category
    ));
  };

  // Export test results
  const exportTestResults = (format: 'csv' | 'json') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const allTests = testCategories.flatMap(category => category.tests);

    if (format === 'json') {
      const data = {
        timestamp,
        summary: {
          total: allTests.length,
          passed: allTests.filter(t => t.testStatus === 'PASSED').length,
          failed: allTests.filter(t => t.testStatus === 'FAILED').length,
          pending: allTests.filter(t => t.testStatus === 'PENDING').length
        },
        tests: allTests.map(test => ({
          name: test.name,
          method: test.method,
          endpoint: test.endpoint,
          expectedStatus: test.expectedStatus,
          actualStatus: test.actualStatus || null,
          isPassed: test.testStatus === 'PASSED'
        }))
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-test-results-simplified-${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV format
      const headers = ['Category', 'Name', 'Method', 'Endpoint', 'Expected Status', 'Actual Status', 'Test Status', 'Failure Reason'];
      const rows = allTests.map(test => [
        test.category,
        test.name,
        test.method,
        test.endpoint,
        test.expectedStatus.toString(),
        test.actualStatus?.toString() || '',
        test.testStatus,
        test.failureReason || ''
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-test-results-${timestamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Get all tests for summary calculations
  const getAllTests = () => testCategories.flatMap(category => category.tests);
  const getAllEnabledTests = () => getAllTests().filter(test => test.enabled);

  return (
    <div className="w-full max-w-wide mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
          <Code className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">API Testing Interface</h1>
        </div>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">Test all API endpoints with interactive forms and real-time responses</p>
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">How to use:</h3>
          <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
            <li>• <strong>Single Testing:</strong> Select an endpoint category and specific endpoint from the left panel</li>
            <li>• <strong>Bulk Testing:</strong> Use category-based test suites to test multiple endpoints</li>
            <li>• Configure parameters and request body as needed</li>
            <li>• View real-time response details and test results</li>
            <li>• Export test results to CSV or JSON for documentation</li>
          </ul>
        </div>
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">🔑 Kiểm Thử Xác Thực:</h3>
          <ul className="text-xs sm:text-sm text-green-800 space-y-1">
            <li>• <strong>Tài Khoản Admin:</strong> admin@cvbuilder.com / admin123</li>
            <li>• <strong>Đăng Nhập Cookie:</strong> Trả về 204 + thiết lập HTTP-only cookie (development)</li>
            <li>• <strong>Đăng Nhập Bearer:</strong> Trả về 200 + JSON với access token (production)</li>
            <li>• <strong>Chỉ API Frontend:</strong> Kiểm thử tập trung vào các API thực sự được frontend sử dụng</li>
            <li>• <strong>Random Credentials:</strong> Test đăng ký tự động tạo email/password ngẫu nhiên</li>
            <li>• <strong>JWT Token Field:</strong> Nhập token để test protected endpoints dễ dàng</li>
            <li>• <strong>Kết Quả Mong Đợi:</strong> Cookie login → 204, Bearer login → 200</li>
            <li>• <strong>Thông Tin User:</strong> endpoint /users/me để lấy dữ liệu người dùng hiện tại</li>
          </ul>
        </div>
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2 text-sm sm:text-base">⚠️ Test Strategy:</h3>
          <ul className="text-xs sm:text-sm text-yellow-800 space-y-1">
            <li>• <strong>Status Code Only:</strong> Chỉ validate HTTP status code, không validate response structure</li>
            <li>• <strong>Success Focus:</strong> Hầu hết tests expect 200 (success) với JWT token</li>
            <li>• <strong>Authentication Tests:</strong> Chỉ category Authentication test cả 401 và 200</li>
            <li>• <strong>Functional Tests:</strong> Các category khác chỉ test success scenarios (200)</li>
            <li>• <strong>Simple & Effective:</strong> Tập trung vào functionality thay vì response format</li>
          </ul>
        </div>
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">🚀 Quy Trình Kiểm Thử Xác Thực:</h3>
          <ol className="text-xs sm:text-sm text-blue-800 space-y-1">
            <li>1. <strong>Kiểm Thử Authentication</strong> - Login tests → auto-extract JWT token</li>
            <li>2. <strong>Kiểm Thử Authorization</strong> - 401 errors khi chưa có token</li>
            <li>3. <strong>Kiểm Thử Success Scenarios</strong> - 200 responses khi có JWT token</li>
            <li>4. <strong>Complete API Coverage</strong> - Test tất cả endpoints với cả 2 scenarios</li>
            <li>5. <strong>Realistic Results</strong> - Phản ánh đúng behavior của production API</li>
            <li>6. <strong>JWT Token Auto-Management</strong> - Token tự động extract và sử dụng</li>
          </ol>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'single' | 'bulk')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
          <TabsTrigger value="single" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation">
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Single API Testing</span>
            <span className="sm:hidden">Single</span>
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation">
            <Play className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Bulk Testing</span>
            <span className="sm:hidden">Bulk</span>
          </TabsTrigger>
        </TabsList>

        {/* Single API Testing Tab */}
        <TabsContent value="single">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Panel - Endpoint Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                API Endpoints
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Select an endpoint to test
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="Base Routes" className="w-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-1 mb-3 sm:mb-4">
                  <TabsTrigger value="Base Routes" className="text-xs p-1.5 sm:p-2 touch-manipulation">
                    <Home className="h-3 w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Base</span>
                  </TabsTrigger>
                  <TabsTrigger value="Authentication" className="text-xs p-1.5 sm:p-2 touch-manipulation">
                    <User className="h-3 w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Auth</span>
                  </TabsTrigger>
                  <TabsTrigger value="User Management" className="text-xs p-1.5 sm:p-2 touch-manipulation">
                    <User className="h-3 w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Users</span>
                  </TabsTrigger>
                  <TabsTrigger value="CV Operations" className="text-xs p-1.5 sm:p-2 touch-manipulation">
                    <FileText className="h-3 w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">CV</span>
                  </TabsTrigger>
                  <TabsTrigger value="Subscription" className="text-xs p-1.5 sm:p-2 touch-manipulation">
                    <Crown className="h-3 w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Sub</span>
                  </TabsTrigger>
                  <TabsTrigger value="Admin Routes" className="text-xs p-1.5 sm:p-2 touch-manipulation">
                    <Shield className="h-3 w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Admin</span>
                  </TabsTrigger>
                  <TabsTrigger value="Health & Setup" className="text-xs p-1.5 sm:p-2 touch-manipulation">
                    <Activity className="h-3 w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Health</span>
                  </TabsTrigger>
                  <TabsTrigger value="Debug Routes" className="text-xs p-1.5 sm:p-2 touch-manipulation">
                    <Bug className="h-3 w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Debug</span>
                  </TabsTrigger>
                </div>
                
                {Object.entries(apiEndpoints).map(([category, endpoints]) => (
                  <TabsContent key={category} value={category} className="space-y-2">
                    {endpoints.map((endpoint, index) => (
                      <Button
                        key={index}
                        variant={selectedEndpoint === endpoint ? "default" : "outline"}
                        className="w-full justify-start text-left h-auto p-2 sm:p-3 touch-manipulation"
                        onClick={() => {
                          setSelectedEndpoint(endpoint);
                          setParameters({});
                          setRequestBody(endpoint.bodyType === 'json' ? getSampleJson(endpoint) : '');
                          setResponse(null);
                        }}
                      >
                        <div className="flex flex-col items-start gap-1 w-full">
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <Badge
                              variant={endpoint.method === 'GET' ? 'secondary' : 'default'}
                              className="text-xs flex-shrink-0"
                            >
                              {endpoint.method}
                            </Badge>
                            <span className="font-mono text-xs break-all">{endpoint.path}</span>
                          </div>
                          <span className="text-xs text-gray-600 text-left leading-tight">
                            {endpoint.description}
                          </span>
                          {endpoint.requiresAuth && (
                            <Badge variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Auth Required</span>
                              <span className="sm:hidden">Auth</span>
                            </Badge>
                          )}
                        </div>
                      </Button>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Middle Panel - Request Configuration */}
        <div className="lg:col-span-1">
          {selectedEndpoint ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                  Request Configuration
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Configure parameters and request body
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Endpoint Info */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={selectedEndpoint.method === 'GET' ? 'secondary' : 'default'}>
                      {selectedEndpoint.method}
                    </Badge>
                    <span className="font-mono text-sm">{selectedEndpoint.path}</span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedEndpoint.description}</p>
                </div>

                {/* Authentication Token */}
                {(selectedEndpoint.requiresAuth || selectedEndpoint.requiresAdmin) && (
                  <div className="space-y-2">
                    <Label htmlFor="auth-token">Authentication Token (Optional)</Label>
                    <Input
                      id="auth-token"
                      type="password"
                      placeholder="Bearer token (leave empty to use stored token)"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Leave empty to use the currently stored authentication token
                    </p>
                  </div>
                )}

                {/* Parameters */}
                {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Parameters</Label>
                    {selectedEndpoint.parameters.map((param) => (
                      <div key={param.name} className="space-y-1">
                        <Label htmlFor={param.name} className="text-xs">
                          {param.name}
                          {param.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {param.type === 'file' ? (
                          <Input
                            id={param.name}
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleParameterChange(param.name, file);
                              }
                            }}
                          />
                        ) : param.type === 'boolean' ? (
                          <select
                            id={param.name}
                            title={`Select ${param.name}`}
                            className="w-full p-2 border rounded-md"
                            value={parameters[param.name] || ''}
                            onChange={(e) => handleParameterChange(param.name, e.target.value === 'true')}
                          >
                            <option value="">Select...</option>
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        ) : (
                          <Input
                            id={param.name}
                            type={param.type === 'number' ? 'number' : 'text'}
                            placeholder={param.description || `Enter ${param.name}`}
                            value={parameters[param.name] || ''}
                            onChange={(e) => handleParameterChange(param.name, e.target.value)}
                          />
                        )}
                        {param.description && (
                          <p className="text-xs text-gray-500">{param.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Request Body */}
                {selectedEndpoint.bodyType === 'json' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="request-body">Request Body (JSON)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRequestBody(getSampleJson(selectedEndpoint))}
                      >
                        Load Sample
                      </Button>
                    </div>
                    <Textarea
                      id="request-body"
                      placeholder="Enter JSON request body..."
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Enter valid JSON for the request body
                    </p>
                  </div>
                )}

                {/* Execute Button */}
                <Button
                  onClick={executeRequest}
                  disabled={loading}
                  className="w-full touch-manipulation"
                  size="default"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                      <span className="text-xs sm:text-sm">Executing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <span className="text-xs sm:text-sm">Execute Request</span>
                    </>
                  )}
                </Button>

                {/* URL Preview */}
                <div className="p-2 sm:p-3 bg-gray-100 rounded text-xs font-mono break-all">
                  <strong>URL:</strong> {selectedEndpoint ? buildUrl(selectedEndpoint) : ''}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an endpoint to configure the request</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Response */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                    Response
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    API response details and data
                  </CardDescription>
                </div>
                {response && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResponse(null)}
                    className="touch-manipulation self-start sm:self-auto"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {response ? (
                <div className="space-y-3 sm:space-y-4">
                  {/* Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Badge
                      variant={response.status >= 200 && response.status < 300 ? 'default' : 'destructive'}
                      className="self-start"
                    >
                      {response.status} {response.statusText}
                    </Badge>
                    <span className="text-xs text-gray-500">{response.timestamp}</span>
                  </div>

                  {/* Headers */}
                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-2 block">Response Headers</Label>
                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg max-h-32 overflow-y-auto">
                      <pre className="text-xs">
                        {Object.entries(response.headers).map(([key, value]) => (
                          <div key={key} className="break-all">
                            <strong>{key}:</strong> {value}
                          </div>
                        ))}
                      </pre>
                    </div>
                  </div>

                  {/* Response Data */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <Label className="text-xs sm:text-sm font-medium">Response Data</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const responseText = typeof response.data === 'string'
                            ? response.data
                            : JSON.stringify(response.data, null, 2);
                          copyToClipboard(responseText);
                        }}
                        className="touch-manipulation self-start sm:self-auto"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="bg-gray-900 text-green-400 p-2 sm:p-4 rounded-lg max-h-64 sm:max-h-96 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap break-all">
                        {typeof response.data === 'string'
                          ? response.data
                          : JSON.stringify(response.data, null, 2)
                        }
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Execute a request to see the response</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
          </div>
        </TabsContent>

        {/* Bulk Testing Tab */}
        <TabsContent value="bulk">
          <div className="space-y-4 sm:space-y-6">
            {/* JWT Token Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                  JWT Token Configuration
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Nhập JWT token để test các protected endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="manual-jwt-token" className="text-sm sm:text-base">JWT Token (Optional)</Label>
                    <Input
                      id="manual-jwt-token"
                      type="password"
                      placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
                      value={manualJwtToken}
                      onChange={(e) => setManualJwtToken(e.target.value)}
                      className="font-mono text-xs sm:text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Token này sẽ được sử dụng cho tất cả tests có "Auth" requirement.
                      Bạn có thể copy token từ kết quả login test hoặc browser DevTools.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setManualJwtToken('')}
                      disabled={!manualJwtToken}
                      className="touch-manipulation"
                    >
                      Clear Token
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const token = getAuthToken();
                        if (token) {
                          setManualJwtToken(token);
                        }
                      }}
                      className="touch-manipulation"
                    >
                      Use Current Session Token
                    </Button>
                  </div>
                  {manualJwtToken && (
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-xs text-green-700">
                        ✅ JWT Token configured ({manualJwtToken.length} characters)
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bulk Test Controls */}
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                      Bulk API Testing
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Run multiple API tests simultaneously and compare results
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    {bulkTestRunning && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        <span className="hidden sm:inline">Running test {currentTestIndex + 1} of {getAllEnabledTests().length}</span>
                        <span className="sm:hidden">{currentTestIndex + 1}/{getAllEnabledTests().length}</span>
                        {currentCategory && currentCategory !== 'all' && (
                          <span className="text-xs">({currentCategory})</span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={runAllTests}
                        disabled={bulkTestRunning || getAllEnabledTests().length === 0}
                        className="bg-green-600 hover:bg-green-700 touch-manipulation"
                        size="sm"
                      >
                        <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Run All Tests</span>
                        <span className="sm:hidden">Run All</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={resetAllTests}
                        disabled={bulkTestRunning}
                        className="touch-manipulation"
                        size="sm"
                      >
                        <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Reset All</span>
                        <span className="sm:hidden">Reset</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Test Results Summary */}
                {bulkTestResults && (
                  <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                      <div>
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{bulkTestResults.totalTests}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Total Tests</div>
                      </div>
                      <div>
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{bulkTestResults.passedTests}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Passed</div>
                      </div>
                      <div>
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">{bulkTestResults.failedTests}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Failed</div>
                      </div>
                      <div>
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-600">
                          {bulkTestResults.duration ? `${(bulkTestResults.duration / 1000).toFixed(1)}s` : '-'}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Duration</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Export Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end mb-3 sm:mb-4 gap-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTestResults('csv')}
                      disabled={getAllTests().length === 0}
                      className="touch-manipulation"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTestResults('json')}
                      disabled={getAllTests().length === 0}
                      className="touch-manipulation"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Export JSON
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category-based Test Tables */}
            <div className="space-y-3 sm:space-y-4">
              {testCategories.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCategory(category.id)}
                          className="p-1 touch-manipulation"
                        >
                          {category.expanded ? (
                            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                          ) : (
                            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                          )}
                        </Button>
                        <category.icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        <div>
                          <CardTitle className="text-base sm:text-lg">{category.name}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">
                            {category.description} • {category.tests.length} tests
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="text-xs sm:text-sm text-gray-500">
                          {category.tests.filter(t => t.enabled).length} enabled
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runCategoryTests(category.id)}
                            disabled={bulkTestRunning || category.tests.filter(t => t.enabled).length === 0}
                            className="text-xs touch-manipulation"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Run Category</span>
                            <span className="sm:hidden">Run</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resetCategoryTests(category.id)}
                            disabled={bulkTestRunning}
                            className="text-xs touch-manipulation"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Reset</span>
                            <span className="sm:hidden">Reset</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {category.expanded && (
                    <CardContent className="p-0 sm:p-6">
                      <div className="overflow-x-auto -mx-3 sm:mx-0">
                        <table className="w-full min-w-[800px] border-collapse border border-gray-200">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-200 px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                <input
                                  type="checkbox"
                                  title="Toggle all tests in category"
                                  checked={category.tests.length > 0 && category.tests.every(t => t.enabled)}
                                  onChange={(e) => {
                                    const allEnabled = e.target.checked;
                                    setTestCategories(prev => prev.map(cat =>
                                      cat.id === category.id ? {
                                        ...cat,
                                        tests: cat.tests.map(test => ({ ...test, enabled: allEnabled }))
                                      } : cat
                                    ));
                                  }}
                                  className="mr-1 sm:mr-2 touch-manipulation"
                                />
                                <span className="hidden sm:inline">Enabled</span>
                                <span className="sm:hidden">En</span>
                              </th>
                              <th className="border border-gray-200 px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px] sm:min-w-[250px]">
                                Test Name
                              </th>
                              <th className="border border-gray-200 px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Method
                              </th>
                              <th className="border border-gray-200 px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">
                                Endpoint
                              </th>
                              <th className="border border-gray-200 px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                <span className="hidden sm:inline">Expected Status</span>
                                <span className="sm:hidden">Exp</span>
                              </th>
                              <th className="border border-gray-200 px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                <span className="hidden sm:inline">Actual Status</span>
                                <span className="sm:hidden">Act</span>
                              </th>
                              <th className="border border-gray-200 px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                <span className="hidden sm:inline">Test Status</span>
                                <span className="sm:hidden">Status</span>
                              </th>
                              <th className="border border-gray-200 px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {category.tests.map((test) => (
                              <tr key={test.id} className={`${test.testStatus === 'RUNNING' ? 'bg-blue-50' : ''}`}>
                                <td className="border border-gray-200 px-2 sm:px-3 py-2">
                                  <Switch
                                    checked={test.enabled}
                                    onCheckedChange={(checked) => updateTest(category.id, test.id, { enabled: checked })}
                                    disabled={bulkTestRunning}
                                  />
                                </td>
                                <td className="border border-gray-200 px-2 sm:px-3 py-2 min-w-[200px] sm:min-w-[250px] max-w-[300px] sm:max-w-[350px]">
                                  <div className="text-xs sm:text-sm font-medium text-gray-900 whitespace-normal break-words leading-relaxed py-1">
                                    {test.name}
                                  </div>
                                </td>
                                <td className="border border-gray-200 px-2 sm:px-3 py-2">
                                  <div className="flex flex-col gap-1">
                                    <Badge variant={test.method === 'GET' ? 'secondary' : 'default'} className="text-xs">
                                      {test.method}
                                    </Badge>
                                    {test.requiresAuth && (
                                      <Badge variant="outline" className="text-xs">
                                        <Shield className="h-3 w-3 mr-1" />
                                        <span className="hidden sm:inline">Auth</span>
                                        <span className="sm:hidden">A</span>
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="border border-gray-200 px-2 sm:px-3 py-2">
                                  <input
                                    type="text"
                                    title="API endpoint"
                                    value={test.endpoint}
                                    onChange={(e) => updateTest(category.id, test.id, { endpoint: e.target.value })}
                                    className="w-full px-1 sm:px-2 py-1 text-xs sm:text-sm border rounded font-mono"
                                    disabled={bulkTestRunning}
                                  />
                                </td>
                                <td className="border border-gray-200 px-2 sm:px-3 py-2">
                                  <input
                                    type="number"
                                    title="Expected status code"
                                    value={test.expectedStatus}
                                    onChange={(e) => updateTest(category.id, test.id, { expectedStatus: parseInt(e.target.value) })}
                                    className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-xs sm:text-sm border rounded"
                                    disabled={bulkTestRunning}
                                  />
                                </td>
                                <td className="border border-gray-200 px-2 sm:px-3 py-2">
                                  {test.actualStatus ? (
                                    <Badge variant={test.actualStatus >= 200 && test.actualStatus < 300 ? 'default' : 'destructive'} className="text-xs">
                                      {test.actualStatus}
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-400 text-xs sm:text-sm">-</span>
                                  )}
                                </td>
                                <td className="border border-gray-200 px-2 sm:px-3 py-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                    <div className="flex items-center gap-1">
                                      {test.testStatus === 'PENDING' && <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />}
                                      {test.testStatus === 'RUNNING' && <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 animate-spin" />}
                                      {test.testStatus === 'PASSED' && <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />}
                                      {test.testStatus === 'FAILED' && <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />}
                                      <span className={`text-xs sm:text-sm font-medium ${
                                        test.testStatus === 'PASSED' ? 'text-green-600' :
                                        test.testStatus === 'FAILED' ? 'text-red-600' :
                                        test.testStatus === 'RUNNING' ? 'text-blue-600' :
                                        'text-gray-600'
                                      }`}>
                                        {test.testStatus}
                                      </span>
                                    </div>
                                    {test.failureReason && (
                                      <div className="text-xs text-red-600 mt-1 sm:mt-0 break-words">{test.failureReason}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="border border-gray-200 px-2 sm:px-3 py-2">
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        const result = await executeBulkTest(test);
                                        updateTest(category.id, test.id, result);
                                      }}
                                      disabled={bulkTestRunning}
                                      className="text-xs px-1 sm:px-2 py-1 touch-manipulation"
                                    >
                                      Test
                                    </Button>
                                    {(test.endpoint === '/auth/bearer/login' || test.endpoint === '/auth/jwt/login') &&
                                     test.testStatus === 'PASSED' && test.actualResponse && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          const token = extractJwtFromResponse(test.actualResponse);
                                          if (token) {
                                            setManualJwtToken(token);
                                          }
                                        }}
                                        className="text-xs px-1 sm:px-2 py-1 text-green-600 hover:text-green-700 touch-manipulation"
                                        title="Copy JWT token from this login response"
                                      >
                                        <span className="hidden sm:inline">Copy JWT</span>
                                        <span className="sm:hidden">JWT</span>
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => removeTest(category.id, test.id)}
                                      disabled={bulkTestRunning}
                                      className="text-xs px-1 sm:px-2 py-1 text-red-600 hover:text-red-700 touch-manipulation"
                                    >
                                      <span className="hidden sm:inline">Remove</span>
                                      <span className="sm:hidden">Del</span>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default APITestingPage;
