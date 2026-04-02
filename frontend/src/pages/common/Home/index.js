import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HideLoading, ShowLoading } from '../../../redux/loaderSlice';
import { getAllExams } from '../../../apiCalls/exams';
import { Col, Row, Card, message, Statistic } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useNavigationMenu } from '../../../hooks/useNavigationMenu';

function Home({ children }) {
  const { user } = useSelector((state) => state.users);
  const [exams, setExams] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [collapsed, setCollapsed] = useState();
  const { userMenu, adminMenu, getUserData, getIsActiveOrNot } = useNavigationMenu();

  const getExams = useCallback(async () => {
    try {
      dispatch(ShowLoading());
      const response = await getAllExams();
      if (response.success) {
        setExams(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(HideLoading());
    }
  }, [dispatch]);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      getUserData().then(userData => {
        if (userData?.isAdmin) {
          setMenu(adminMenu);
        } else {
          setMenu(userMenu);
        }
      });
    } else {
      navigate('/login');
    }
  }, [adminMenu, getUserData, navigate, userMenu]);

  useEffect(() => {
    getExams();
  }, [getExams]);

  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return "Good Morning";
    if (currentHour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    user && (
      <div className="modern-layout">
        <div className="layout">
          <div className="flex gap-2">
            <div className="body">
              {/* Modern Header */}
              <div className="modern-header">
                <div className="header-content">
                  <div className="menu-toggle">
                    {!collapsed && (
                      <i
                        className="ri-menu-line toggle-icon"
                        onClick={() => setCollapsed(true)}
                      ></i>
                    )}
                    {collapsed && (
                      <i
                        className="ri-close-line toggle-icon"
                        onClick={() => setCollapsed(false)}
                      ></i>
                    )}
                  </div>

                  <div className="header-center">
                    <h1 className="portal-title">
                      <i className="ri-graduation-cap-line"></i>
                      DRIEMS Quiz Assessment Portal
                    </h1>
                  </div>

                  <div className="user-profile">
                    <div className="user-avatar">
                      <i className="ri-user-line"></i>
                    </div>
                    <div className="user-info">
                      <h3>{user?.name}</h3>
                      <span className="user-role">
                        {user?.isAdmin ? "Administrator" : "Student"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex">
                {/* Modern Sidebar */}
                {collapsed && (
                  <div className="modern-sidebar">
                    <div className="sidebar-header">
                      <div className="sidebar-header-content">
                        <h3>Navigation</h3>
                        {/* Close button for mobile */}
                        <div className="sidebar-close-mobile">
                          <i
                            className="ri-close-line toggle-icon"
                            onClick={() => setCollapsed(false)}
                          ></i>
                        </div>
                      </div>
                    </div>
                    <div className="menu-list">
                      {menu.map((item, index) => (
                        <div
                          className={`modern-menu-item ${
                            getIsActiveOrNot(item.path) && "active-menu-item"
                          }`}
                          key={index}
                          onClick={item.onClick}
                        >
                          <span className="menu-icon">{item.icon}</span>
                          <span className="menu-text">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Content Area */}
                <div
                  className={`main-content ${
                    collapsed ? `content-collapsed` : ``
                  }`}
                >
                  {/* Welcome Section */}
                  <div className="welcome-section">
                    <div className="welcome-card">
                      <div className="welcome-content">
                        <h2 className="welcome-title">
                          {getGreeting()}, {user?.name}!
                        </h2>
                        <p className="welcome-subtitle">
                          Welcome to your personalized quiz assessment dashboard
                        </p>
                      </div>
                      <div className="welcome-decoration">
                        <i className="ri-book-open-line"></i>
                      </div>
                    </div>
                  </div>

                  {/* Statistics Cards */}
                  <div className="stats-section">
                    <Row gutter={[24, 24]}>
                      <Col xs={24} sm={12} md={6}>
                        <Card className="stats-card total-exams">
                          <Statistic
                            title="Total Exams"
                            value={exams.length}
                            prefix={<i className="ri-file-list-line"></i>}
                            valueStyle={{color: "#6462ee"}}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card className="stats-card completed">
                          <Statistic
                            title="Available Exams"
                            value={exams.filter((exam) => exam).length}
                            prefix={<i className="ri-check-circle-line"></i>}
                            valueStyle={{color: "#16e04c"}}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card className="stats-card pending">
                          <Statistic
                            title="Your Role"
                            value={user?.isAdmin ? "Admin" : "Student"}
                            prefix={<i className="ri-user-star-line"></i>}
                            valueStyle={{color: "#ff6b6b"}}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card className="stats-card performance">
                          <Statistic
                            title="Status"
                            value="Active"
                            prefix={<i className="ri-flashlight-line"></i>}
                            valueStyle={{color: "#ffd93d"}}
                          />
                        </Card>
                      </Col>
                    </Row>
                  </div>

                  {/* Available Exams Section */}
                  <div className="exams-section">
                    <div className="section-header">
                      <h2 className="section-title">
                        <i className="ri-exam-line"></i>
                        Available Exams
                      </h2>
                      <p className="section-subtitle">
                        Choose an exam to begin your assessment
                      </p>
                    </div>

                    <Row gutter={[24, 24]}>
                      {exams.map((exam) => (
                        <Col
                          key={exam._id}
                          xs={24}
                          sm={12}
                          md={8}
                          lg={6}
                          xl={6}
                        >
                          <div className="modern-exam-card">
                            <div className="exam-card-header">
                              <div className="exam-icon">
                                <i className="ri-file-text-line"></i>
                              </div>
                              <div className="exam-category">
                                {exam.category}
                              </div>
                            </div>

                            <div className="exam-card-body">
                              <h3 className="exam-title">{exam.name}</h3>

                              <div className="exam-details">
                                <div className="detail-item">
                                  <i className="ri-time-line"></i>
                                  <span>{exam.duration} mins</span>
                                </div>
                                <div className="detail-item">
                                  <i className="ri-star-line"></i>
                                  <span>{exam.totalMark} marks</span>
                                </div>
                                <div className="detail-item">
                                  <i className="ri-target-line"></i>
                                  <span>Pass: {exam.passingMark}</span>
                                </div>
                              </div>
                            </div>

                            <div className="exam-card-footer">
                              <button
                                className="modern-start-btn"
                                onClick={() => {
                                  navigate(`user/write-exam/${exam._id}`);
                                }}
                              >
                                <i className="ri-play-circle-line"></i>
                                Start Exam
                              </button>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>

                    {exams.length === 0 && (
                      <div className="no-exams">
                        <div className="no-exams-content">
                          <i className="ri-inbox-line"></i>
                          <h3>No Exams Available</h3>
                          <p>Please check back later for new assessments.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="content">{children}</div>
            </div>
          </div>
        </div>
      </div>
    )
  );
}

export default Home;
