import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

interface ContentProject {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  status: 'draft' | 'published' | 'archived';
  views: number;
  engagement: number;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  
  // Mock data - in a real app this would come from an API
  const mockProjects: ContentProject[] = [
    {
      id: '1',
      title: 'How AI is Transforming Content Creation for SEO',
      type: 'blog',
      createdAt: '2025-06-15T10:30:00Z',
      status: 'published',
      views: 245,
      engagement: 68
    },
    {
      id: '2',
      title: 'Top 10 Digital Marketing Trends for 2025',
      type: 'blog',
      createdAt: '2025-06-10T14:15:00Z',
      status: 'published',
      views: 1203,
      engagement: 89
    },
    {
      id: '3',
      title: 'The Ultimate Guide to Content Strategy',
      type: 'whitepaper',
      createdAt: '2025-06-05T09:45:00Z',
      status: 'draft',
      views: 0,
      engagement: 0
    },
    {
      id: '4',
      title: 'ContentArchitect Product Overview',
      type: 'product',
      createdAt: '2025-06-01T16:20:00Z',
      status: 'published',
      views: 456,
      engagement: 72
    },
    {
      id: '5',
      title: 'Email Campaign: Summer Sale Announcement',
      type: 'email',
      createdAt: '2025-05-28T11:10:00Z',
      status: 'archived',
      views: 3567,
      engagement: 45
    }
  ];

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleCreateNew = () => {
    navigate('/welcome');
  };

  const filteredProjects = mockProjects.filter(project => {
    if (activeTab === 'all') return true;
    return project.status === activeTab;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'views') {
      return b.views - a.views;
    } else if (sortBy === 'engagement') {
      return b.engagement - a.engagement;
    }
    return 0;
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
            <p className="text-neutral-600 mt-1">Manage and monitor your content projects</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button 
              onClick={handleCreateNew}
              leftIcon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              Create New Content
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-500">Total Content</p>
                <h3 className="text-3xl font-bold text-neutral-900 mt-1">{mockProjects.length}</h3>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-neutral-600">
                <span className="text-green-600 font-medium">+3 new</span>
                <span className="mx-1">in the last 7 days</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-b2b/5 to-b2b/10">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-500">Total Views</p>
                <h3 className="text-3xl font-bold text-neutral-900 mt-1">
                  {mockProjects.reduce((sum, project) => sum + project.views, 0).toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-b2b/10 rounded-full">
                <svg className="h-6 w-6 text-b2b" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-neutral-600">
                <span className="text-green-600 font-medium">+12%</span>
                <span className="mx-1">from last month</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-b2c/5 to-b2c/10">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-500">Avg Engagement</p>
                <h3 className="text-3xl font-bold text-neutral-900 mt-1">
                  {Math.round(mockProjects.reduce((sum, project) => sum + project.engagement, 0) / mockProjects.length)}%
                </h3>
              </div>
              <div className="p-3 bg-b2c/10 rounded-full">
                <svg className="h-6 w-6 text-b2c" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-neutral-600">
                <span className="text-green-600 font-medium">+5%</span>
                <span className="mx-1">from last month</span>
              </div>
            </div>
          </Card>
        </div>
        
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div className="flex space-x-4 mb-4 sm:mb-0">
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'all'
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
                onClick={() => setActiveTab('all')}
              >
                All Content
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'published'
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
                onClick={() => setActiveTab('published')}
              >
                Published
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'draft'
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
                onClick={() => setActiveTab('draft')}
              >
                Drafts
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'archived'
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
                onClick={() => setActiveTab('archived')}
              >
                Archived
              </button>
            </div>
            
            <div>
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Sort by Date</option>
                <option value="views">Sort by Views</option>
                <option value="engagement">Sort by Engagement</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Engagement
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {sortedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {project.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      <span className="capitalize">{project.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {formatDate(project.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          project.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : project.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {project.views.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {project.engagement}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-primary hover:text-primary-dark mr-4">
                        View
                      </button>
                      <button className="text-neutral-600 hover:text-neutral-900">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {sortedProjects.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-neutral-900">No content found</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Get started by creating a new content project.
              </p>
              <div className="mt-6">
                <Button 
                  onClick={handleCreateNew}
                  leftIcon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  }
                >
                  Create New Content
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
