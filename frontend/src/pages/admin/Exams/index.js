import React,{useEffect} from 'react'
import PageTitles from '../../../component/PageTitles';
import { useNavigate } from 'react-router-dom';
import {Table} from 'antd';
import { useDispatch } from 'react-redux';
import { HideLoading, ShowLoading } from '../../../redux/loaderSlice';
import { message } from 'antd';
import { deleteExamById, getAllExams } from '../../../apiCalls/exams';
import {useSelector} from 'react-redux';
import { useState } from 'react';
import { useNavigationMenu } from '../../../hooks/useNavigationMenu';

function Exams({children}) {
  const navigate= useNavigate();
  const [exams,setExams]= React.useState([]);
  const dispatch=useDispatch();
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
  const getExamsData= async ()=>{
    try {
      dispatch(ShowLoading());
      const response= await getAllExams();
      dispatch(HideLoading());
     if(response.success){
      setExams(response.data);
     }else{
      message.error(response.message);
     }
    
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  }
  React.useEffect(()=>{
    getExamsData();
  },[]);
  const deleteExam=async (examId)=>{
    try{
          dispatch(ShowLoading());
          const response=await deleteExamById({
            examId
          });
          dispatch(HideLoading());
          if(response.success){
            message.success(response.message);
            getExamsData();
          }else{
            message.error(response.message)
          }
    }catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  }
  const columns = [
    {
      title: 'Exam Name',
      dataIndex: "name"
    },
    {
      title:'Duration',
      dataIndex: "duration",
      className:"Colhide"
    },
    {
      title:'Category',
      dataIndex: "category",
    },
    {
      title:'Total Marks',
      dataIndex: "totalMark",
      className:"Colhide"
    },
    {
      title:'Passing Marks',
      dataIndex: "passingMark",
      className:"Colhide"
    },
    {
      title:'Action',
      dataIndex:"action",
      render:(text,record)=> {
        return (
          <div className='flex gap-2'>
            <i className="ri-pencil-line" 
            onClick={()=>{
              navigate(`/admin/exams/edit/${record._id}`);
            }}
            ></i>
            <i className="ri-delete-bin-line" onClick={()=>{deleteExam(record._id)}}></i>
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
                  <div className="exams-section">
                    <div className="flex justify-between mt-2 item-center">
                      <PageTitles title="Exams" />
                      <button
                        className="primary-btn"
                        onClick={() => {
                          navigate("/admin/exams/add");
                        }}
                      >
                        <i className="ri-add-line"></i>
                        Add Exam
                      </button>
                    </div>
                    <div className="divider mt-2"></div>
                    <Table
                      columns={columns}
                      dataSource={exams}
                      pagination={{pageSize: 6}}
                      className="modern-table"
                    />
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

export default Exams;
