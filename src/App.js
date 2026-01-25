import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { auth, jobs, recommendations } from './utils/api';
import './App.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await auth.login(email, password);
      if (data.user.role === 'recruiter') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/company/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>VC Portfolio Platform</h1>
        <p className="subtitle">Connecting talent with portfolio companies</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="demo-accounts">
          <p><strong>Demo Accounts:</strong></p>
          <p>Recruiter: recruiter@example.com / password123</p>
          <p>Company: contact@techventure.com / password123</p>
        </div>
      </div>
    </div>
  );
}

function RecruiterDashboard() {
  const [stats, setStats] = useState(null);
  const [jobsList, setJobsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, jobsData] = await Promise.all([jobs.getStats(), jobs.getAll({ status: 'open' })]);
      setStats(statsData);
      setJobsList(jobsData.slice(0, 5));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Recruiter Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.openJobs || 0}</div>
          <div className="stat-label">Open Positions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalCompanies || 0}</div>
          <div className="stat-label">Portfolio Companies</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.urgentJobs || 0}</div>
          <div className="stat-label">Urgent Roles</div>
        </div>
      </div>
      <div className="section">
        <div className="section-header">
          <h2>Recent Open Positions</h2>
          <button className="btn-secondary" onClick={() => navigate('/recruiter/jobs')}>View All Jobs</button>
        </div>
        <div className="jobs-list">
          {jobsList.map(job => (
            <div key={job._id} className="job-card">
              <div className="job-header">
                <div>
                  <h3>{job.title}</h3>
                  <p className="company-name">{job.company?.name}</p>
                </div>
                {job.priority === 'urgent' && <span className="badge-urgent">Urgent</span>}
              </div>
              <div className="job-meta">
                <span>📍 {job.location}</span>
                <span>💼 {job.level}</span>
                <span>🏢 {job.department}</span>
                {job.salaryRange && <span>💰 {job.salaryRange.currency} {job.salaryRange.min?.toLocaleString()} - {job.salaryRange.max?.toLocaleString()}</span>}
              </div>
              <button className="btn-primary btn-sm" onClick={() => navigate(`/recruiter/recommend/${job._id}`)}>
                Recommend Candidate
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecruiterJobsList() {
  const [jobsList, setJobsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await jobs.getAll({ status: 'open' });
      setJobsList(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobsList.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1>All Open Positions</h1>
      <div className="search-bar">
        <input type="text" placeholder="Search jobs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      <div className="jobs-grid">
        {filteredJobs.map(job => (
          <div key={job._id} className="job-card">
            <div className="job-header">
              <div>
                <h3>{job.title}</h3>
                <p className="company-name">{job.company?.name}</p>
              </div>
              {job.priority === 'urgent' && <span className="badge-urgent">Urgent</span>}
            </div>
            <p className="job-description">{job.description}</p>
            <div className="job-meta">
              <span>📍 {job.location}</span>
              <span>💼 {job.level}</span>
              <span>🏢 {job.department}</span>
              {job.salaryRange && <span>💰 {job.salaryRange.currency} {job.salaryRange.min?.toLocaleString()} - {job.salaryRange.max?.toLocaleString()}</span>}
            </div>
            <button className="btn-primary btn-sm" onClick={() => navigate(`/recruiter/recommend/${job._id}`)}>
              Recommend Candidate
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendForm() {
  const navigate = useNavigate();
  const jobId = window.location.pathname.split('/').pop();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', currentRole: '', currentCompany: '',
    linkedinUrl: '', yearsOfExperience: '', recruiterNotes: '', status: 'draft'
  });

  useEffect(() => {
    loadJob();
  }, []);

  const loadJob = async () => {
    try {
      const data = await jobs.getById(jobId);
      setJob(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await recommendations.create({
        jobId,
        candidate: {
          name: formData.name, email: formData.email, phone: formData.phone,
          currentRole: formData.currentRole, currentCompany: formData.currentCompany,
          linkedinUrl: formData.linkedinUrl, yearsOfExperience: parseInt(formData.yearsOfExperience)
        },
        recruiterNotes: formData.recruiterNotes,
        status: formData.status
      });
      alert('Recommendation created successfully!');
      navigate('/recruiter/recommendations');
    } catch (err) {
      alert('Error creating recommendation');
    } finally {
      setLoading(false);
    }
  };

  if (!job) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Recommend Candidate</h1>
      <div className="job-summary">
        <h3>{job.title}</h3>
        <p>{job.company?.name} • {job.location}</p>
        {job.salaryRange && <p>💰 {job.salaryRange.currency} {job.salaryRange.min?.toLocaleString()} - {job.salaryRange.max?.toLocaleString()}</p>}
      </div>
      <form onSubmit={handleSubmit} className="form-large">
        <h2>Candidate Information</h2>
        <div className="form-group">
          <label>Full Name *</label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Current Role *</label>
          <input type="text" value={formData.currentRole} onChange={(e) => setFormData({...formData, currentRole: e.target.value})} required />
        </div>
        <div className="form-group">
          <label>Current Company</label>
          <input type="text" value={formData.currentCompany} onChange={(e) => setFormData({...formData, currentCompany: e.target.value})} />
        </div>
        <div className="form-group">
          <label>LinkedIn URL</label>
          <input type="url" value={formData.linkedinUrl} onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Years of Experience</label>
          <input type="number" value={formData.yearsOfExperience} onChange={(e) => setFormData({...formData, yearsOfExperience: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Your Notes (Private) *</label>
          <textarea value={formData.recruiterNotes} onChange={(e) => setFormData({...formData, recruiterNotes: e.target.value})} required rows="4" placeholder="Why is this candidate a good fit?" />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
            <option value="draft">Save as Draft (Private)</option>
            <option value="submitted">Submit to Company</option>
          </select>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Create Recommendation'}</button>
        </div>
      </form>
    </div>
  );
}

function RecruiterRecommendations() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const data = await recommendations.getAll();
      setRecs(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (id) => {
    if (!window.confirm('Submit this recommendation to the company?')) return;
    try {
      await recommendations.submit(id);
      alert('Recommendation submitted successfully!');
      loadRecommendations();
    } catch (err) {
      alert('Error submitting recommendation');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1>My Recommendations</h1>
      {recs.length === 0 ? (
        <div className="empty-state"><p>No recommendations yet</p></div>
      ) : (
        <div className="recs-list">
          {recs.map(rec => (
            <div key={rec._id} className="rec-card">
              <div className="rec-header">
                <div>
                  <h3>{rec.candidate.name}</h3>
                  <p>{rec.candidate.currentRole}</p>
                </div>
                <span className={`badge-${rec.status}`}>{rec.status}</span>
              </div>
              <p><strong>For:</strong> {rec.job?.title} at {rec.job?.company?.name}</p>
              <p><strong>Your notes:</strong> {rec.recruiterNotes}</p>
              {rec.status === 'draft' && (
                <button className="btn-primary btn-sm" onClick={() => handleSubmit(rec._id)}>Submit to Company</button>
              )}
              {rec.companyFeedback && (
                <div className="feedback"><strong>Company feedback:</strong> {rec.companyFeedback}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyDashboard() {
  const [stats, setStats] = useState(null);
  const [jobsList, setJobsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, jobsData] = await Promise.all([jobs.getStats(), jobs.getAll()]);
      setStats(statsData);
      setJobsList(jobsData.slice(0, 5));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Company Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.openJobs || 0}</div>
          <div className="stat-label">Your Open Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.urgentJobs || 0}</div>
          <div className="stat-label">Urgent Roles</div>
        </div>
      </div>
      <div className="section">
        <div className="section-header">
          <h2>Your Job Postings</h2>
          <button className="btn-primary" onClick={() => navigate('/company/jobs/new')}>Post New Job</button>
        </div>
        <div className="jobs-list">
          {jobsList.map(job => (
            <div key={job._id} className="job-card">
              <div className="job-header">
                <div>
                  <h3>{job.title}</h3>
                  <p>{job.department} • {job.level}</p>
                </div>
                <span className={`badge-${job.status}`}>{job.status}</span>
              </div>
              <p>{job.description}</p>
              {job.salaryRange && <p className="job-meta">💰 {job.salaryRange.currency} {job.salaryRange.min?.toLocaleString()} - {job.salaryRange.max?.toLocaleString()}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PostJobForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', department: 'Engineering', level: 'Mid', location: '',
    remote: 'Hybrid', description: '', skills: '', priority: 'normal',
    salaryMin: '', salaryMax: '', salaryCurrency: 'USD'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const jobData = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
      };
      
      if (formData.salaryMin && formData.salaryMax) {
        jobData.salaryRange = {
          min: parseInt(formData.salaryMin),
          max: parseInt(formData.salaryMax),
          currency: formData.salaryCurrency
        };
      }
      
      await jobs.create(jobData);
      alert('Job posted successfully!');
      navigate('/company/dashboard');
    } catch (err) {
      alert('Error posting job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <h1>Post New Job</h1>
      <form onSubmit={handleSubmit} className="form-large">
        <div className="form-group">
          <label>Job Title *</label>
          <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="e.g., Senior Software Engineer" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Department *</label>
            <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} required>
              <option>Engineering</option>
              <option>Product</option>
              <option>Marketing</option>
              <option>Sales</option>
            </select>
          </div>
          <div className="form-group">
            <label>Level *</label>
            <select value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})} required>
              <option>Junior</option>
              <option>Mid</option>
              <option>Senior</option>
              <option>Lead</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Location *</label>
            <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required placeholder="e.g., San Francisco, CA" />
          </div>
          <div className="form-group">
            <label>Remote *</label>
            <select value={formData.remote} onChange={(e) => setFormData({...formData, remote: e.target.value})} required>
              <option>On-site</option>
              <option>Remote</option>
              <option>Hybrid</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Description *</label>
          <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows="4" />
        </div>
        <div className="form-group">
          <label>Skills (comma-separated)</label>
          <input type="text" value={formData.skills} onChange={(e) => setFormData({...formData, skills: e.target.value})} placeholder="e.g., React, Node.js" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Min Salary</label>
            <input type="number" value={formData.salaryMin} onChange={(e) => setFormData({...formData, salaryMin: e.target.value})} placeholder="e.g., 100000" />
          </div>
          <div className="form-group">
            <label>Max Salary</label>
            <input type="number" value={formData.salaryMax} onChange={(e) => setFormData({...formData, salaryMax: e.target.value})} placeholder="e.g., 150000" />
          </div>
        </div>
        <div className="form-group">
          <label>Currency</label>
          <select value={formData.salaryCurrency} onChange={(e) => setFormData({...formData, salaryCurrency: e.target.value})}>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="AED">AED (د.إ)</option>
          </select>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Posting...' : 'Post Job'}</button>
        </div>
      </form>
    </div>
  );
}

function CompanyRecommendations() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const data = await recommendations.getAll();
      setRecs(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (id) => {
    const feedback = window.prompt('Enter your feedback:');
    const status = window.prompt('Status (reviewed/shortlisted/interviewing/offered/rejected):');
    if (!feedback || !status) return;
    try {
      await recommendations.addFeedback(id, { feedback, status });
      alert('Feedback added successfully!');
      loadRecommendations();
    } catch (err) {
      alert('Error adding feedback');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Candidate Recommendations</h1>
      {recs.length === 0 ? (
        <div className="empty-state"><p>No recommendations yet</p></div>
      ) : (
        <div className="recs-list">
          {recs.map(rec => (
            <div key={rec._id} className="rec-card">
              <div className="rec-header">
                <div>
                  <h3>{rec.candidate.name}</h3>
                  <p>{rec.candidate.currentRole}</p>
                </div>
                <span className={`badge-${rec.status}`}>{rec.status}</span>
              </div>
              <p><strong>For:</strong> {rec.job?.title}</p>
              <p><strong>Email:</strong> {rec.candidate.email}</p>
              {!rec.companyFeedback && (
                <button className="btn-primary btn-sm" onClick={() => handleFeedback(rec._id)}>Add Feedback</button>
              )}
              {rec.companyFeedback && (
                <div className="feedback"><strong>Your feedback:</strong> {rec.companyFeedback}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Nav() {
  const user = auth.getUser();
  const navigate = useNavigate();
  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };
  if (!user) return null;
  return (
    <nav className="navbar">
      <div className="nav-brand"><h2>VC Platform</h2></div>
      <div className="nav-links">
        {user.role === 'recruiter' ? (
          <>
            <Link to="/recruiter/dashboard">Dashboard</Link>
            <Link to="/recruiter/jobs">Jobs</Link>
            <Link to="/recruiter/recommendations">Recommendations</Link>
          </>
        ) : (
          <>
            <Link to="/company/dashboard">Dashboard</Link>
            <Link to="/company/jobs/new">Post Job</Link>
            <Link to="/company/recommendations">Recommendations</Link>
          </>
        )}
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children, allowedRole }) {
  const user = auth.getUser();
  if (!user) return <Navigate to="/login" />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to={`/${user.role}/dashboard`} />;
  return <><Nav />{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/recruiter/dashboard" element={<ProtectedRoute allowedRole="recruiter"><RecruiterDashboard /></ProtectedRoute>} />
        <Route path="/recruiter/jobs" element={<ProtectedRoute allowedRole="recruiter"><RecruiterJobsList /></ProtectedRoute>} />
        <Route path="/recruiter/recommend/:id" element={<ProtectedRoute allowedRole="recruiter"><RecommendForm /></ProtectedRoute>} />
        <Route path="/recruiter/recommendations" element={<ProtectedRoute allowedRole="recruiter"><RecruiterRecommendations /></ProtectedRoute>} />
        <Route path="/company/dashboard" element={<ProtectedRoute allowedRole="company"><CompanyDashboard /></ProtectedRoute>} />
        <Route path="/company/jobs/new" element={<ProtectedRoute allowedRole="company"><PostJobForm /></ProtectedRoute>} />
        <Route path="/company/recommendations" element={<ProtectedRoute allowedRole="company"><CompanyRecommendations /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
