import React, { useEffect, useState } from 'react';
import PageTitles from '../../../component/PageTitles'
import { addExam, deleteQuestionById, editExamById, getExamById } from '../../../apiCalls/exams';
import { message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch ,useSelector} from 'react-redux';
import { HideLoading, ShowLoading } from '../../../redux/loaderSlice';
import { Form, Row, Col, Select, Input, Button, Tabs, Table } from 'antd';
// import TabPane from 'antd/es/tabs/TabPane';
import AddEditQuestions from './AddEditQuestions';
import { useNavigationMenu } from '../../../hooks/useNavigationMenu';

function AddEditExams({children}) {
  const { Option } = Select;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();
  const [showAddEditQuestionModal, setShowAddEditQuestionModal] = useState(false);
  const [selectedQuestion,setSelectedQuestion] = useState(null);
  const [examData, setExamData] = useState();
  const {user}=useSelector((state)=> state.users);
  const [menu,setMenu] = useState([]);
  const [collapsed,setCollapsed] = useState();
  const { userMenu, adminMenu, getUserData, getIsActiveOrNot } = useNavigationMenu();

  useEffect(()=>{
    if(localStorage.getItem("token")){
          getUserData().then(userData => {
            if(userData?.isAdmin){
              setMenu(adminMenu);
            }else{
              setMenu(userMenu);
            }
          });
    }else{
      navigate('/login');
    }
  }
  ,
  []
  );
  
  
  
  
  
  const onSubmit = async (value) => {
    try {
      dispatch(ShowLoading());
      let response;
      if (params.id) {
        response = await editExamById({ ...value, examId: params.id });
      } else {
        response = await addExam(value);
      }
      if (response.success) {
        message.success(response.message);
        navigate("/admin/exams");
      } else {
        message.error(response.message);
      }
      dispatch(HideLoading());
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };
  const getExamData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getExamById({
        examId: params.id
      });
      dispatch(HideLoading());
      if (response.success) {
        setExamData(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  }
  const deleteQuestion = async (questionId) => {
    try {
      dispatch(ShowLoading());
      
      const response = await deleteQuestionById({
        questionId,
        examId: params.id
      });
      console.log(response);
      dispatch(HideLoading());
      
      if(response.success){
        message.success(response.message);
        // Update the state to remove the deleted question
        setExamData(prevExamData => {
          const updatedQuestions = prevExamData.questions.filter(question => question._id !== questionId);
          return {
            ...prevExamData,
            questions: updatedQuestions
          };
        });
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };
  

  useEffect(() => {
    if (params.id) {
      getExamData();
    }
  }, [])
  const questionColumns = [
    {
      title: 'Question',
      dataIndex: 'name',
    },
    {
        title:"Options",
        dataIndex:"options",
        className: 'Colhide',
        render: (text,record) => {
         return Object.keys(record.options).map((key)=>{ 
         return <div>{key}:{record.options[key]}</div>
          });
        }
    },
    {
      title: 'Correct Option',
      dataIndex: 'correctOption',
      render: (text,record) => {    
        return record.options[record.correctOption];
      }
    },
    {
      title: "Action",
      dataIndex: 'action',
      render: (text, record) => {
        return (
          <div className='flex gap-2'>
            <i className="ri-pencil-line"
              onClick={() => {
                setSelectedQuestion(record);
                 setShowAddEditQuestionModal(true);
              }}
            ></i>
            <i className="ri-delete-bin-line" onClick={() => {
             deleteQuestion( record._id)
             }}></i>
          </div>
        )
      }
    }
  ]
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
                  <div className="add-edit-exam-section">
                    <PageTitles title={params.id ? "Edit Exam" : "Add Exam"} />
                    <div className="divider"></div>
                    {(examData || !params.id) && (
                      <Form
                        layout="vertical"
                        onFinish={onSubmit}
                        initialValues={examData}
                      >
                        <Tabs defaultActiveKey="1">
                          <Tabs.TabPane tab="Exam Details" key="1">
                            <Row gutter={[10, 10]}>
                              <Col xs={24} sm={24} md={12} lg={8}>
                                <Form.Item label="Exam Name" name="name">
                                  <Input type="text" className="responsive-input" />
                                </Form.Item>
                              </Col>
                              <Col xs={24} sm={24} md={12} lg={8}>
                                <Form.Item label="Exam Duration" name="duration">
                                  <Input type="number" className="responsive-input" />
                                </Form.Item>
                              </Col>
                              <Col xs={24} sm={24} md={12} lg={8}>
                                <Form.Item label="Category" name="category">
                                  <Select className="responsive-input">
                                    <Option value="">Select Category</Option>
                                    <Option value="CSE">CSE</Option>
                                    <Option value="ME">ME</Option>
                                    <Option value="ETC">ETC</Option>
                                    <Option value="EE">EE</Option>
                                  </Select>
                                </Form.Item>
                              </Col>
                              <Col xs={24} sm={24} md={12} lg={8}>
                                <Form.Item label="Total Marks" name="totalMark">
                                  <Input type="number" className="responsive-input" />
                                </Form.Item>
                              </Col>
                              <Col xs={24} sm={24} md={12} lg={8}>
                                <Form.Item label="Passing Marks" name="passingMark">
                                  <Input type="number" className="responsive-input" />
                                </Form.Item>
                              </Col>
                            </Row>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="primary"
                                className="primary-outlined-btn"
                                onClick={() => {
                                  navigate("/admin/exams");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="primary"
                                htmlType="submit"
                                className="primary-contend-btn"
                              >
                                Save
                              </Button>
                            </div>
                          </Tabs.TabPane>
                          {params.id && (
                            <Tabs.TabPane tab="Questions" key="2">
                              <h1>Questions</h1>
                              <div className="flex justify-end">
                                <Button
                                  className="primary-outlined-btn"
                                  type="button"
                                  onClick={() => {
                                    setShowAddEditQuestionModal(true);
                                  }}
                                >
                                  Add Question
                                </Button>
                              </div>

                              <Table
                                columns={questionColumns}
                                dataSource={examData?.questions || []}
                                className="modern-table"
                              />
                            </Tabs.TabPane>
                          )}
                        </Tabs>
                      </Form>
                    )}
                    {showAddEditQuestionModal && (
                      <AddEditQuestions
                        setShowAddEditQuestionModal={setShowAddEditQuestionModal}
                        showAddEditQuestionModal={showAddEditQuestionModal}
                        examId={params.id}
                        refreshData={getExamData}
                        selectedQuestion={selectedQuestion}
                        setSelectedQuestion={setSelectedQuestion}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
}

export default AddEditExams