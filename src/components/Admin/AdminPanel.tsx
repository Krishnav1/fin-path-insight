import React, { useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Button, Card, Typography, Space, Alert, Spin, Divider, Tag, List, Statistic, Row, Col } from 'antd';
import { ReloadOutlined, DatabaseOutlined, UserOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface CompanyResult {
  symbol: string;
  status: string;
  data?: any;
  error?: string;
}

interface BatchUpdateResult {
  results: CompanyResult[];
  total: number;
  success: number;
  failed: number;
}

const AdminPanel: React.FC = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchUpdateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check admin status on component mount
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        // Check if user is in admin_users table
        const { data, error } = await supabase
          .from('admin_users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking admin status:', error);
          return;
        }
        
        setIsAdmin(data?.role === 'admin');
      } catch (err) {
        console.error('Failed to check admin status:', err);
      }
    };
    
    checkAdminStatus();
  }, [user, supabase]);

  const handleUpdateAllCompanies = async () => {
    if (!isAdmin) {
      setError('You do not have permission to perform this action.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Call the Edge Function with no symbol to update all tracked companies
      const { data, error } = await supabase.functions.invoke('company-data-ingest', {
        body: {} // Empty body triggers batch update mode
      });
      
      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }
      
      setResult(data as BatchUpdateResult);
    } catch (err: any) {
      console.error('Error updating companies:', err);
      setError(err.message || 'Failed to update companies');
    } finally {
      setLoading(false);
    }
  };

  // If user is not logged in or not admin, show restricted message
  if (!user) {
    return (
      <Card title="FinInsight Admin Panel">
        <Alert
          message="Authentication Required"
          description="Please log in to access the admin panel."
          type="warning"
          showIcon
        />
      </Card>
    );
  }
  
  if (!isAdmin) {
    return (
      <Card title="FinInsight Admin Panel">
        <Alert
          message="Access Restricted"
          description="You do not have admin privileges to access this panel."
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card title="FinInsight Admin Panel" className="admin-panel">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>Data Management</Title>
          <Text>Update company data from EODHD API and store it in the database.</Text>
          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={handleUpdateAllCompanies}
            >
              Update All Tracked Companies
            </Button>
          </div>
        </div>

        {error && (
          <Alert message="Error" description={error} type="error" showIcon />
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Updating company data... This may take a few minutes.</Text>
            </div>
          </div>
        )}

        {result && (
          <>
            <Divider />
            <Title level={4}>Update Results</Title>
            
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic 
                  title="Total Companies" 
                  value={result.total} 
                  prefix={<DatabaseOutlined />} 
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Successfully Updated" 
                  value={result.success} 
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Failed" 
                  value={result.failed} 
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
            </Row>
            
            <List
              header={<div>Company Update Details</div>}
              bordered
              dataSource={result.results}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.symbol}
                    description={
                      item.status === 'success' 
                        ? 'Successfully updated' 
                        : `Error: ${item.error}`
                    }
                  />
                  <Tag color={item.status === 'success' ? 'green' : 'red'}>
                    {item.status}
                  </Tag>
                </List.Item>
              )}
            />
          </>
        )}
      </Space>
    </Card>
  );
};

export default AdminPanel;
