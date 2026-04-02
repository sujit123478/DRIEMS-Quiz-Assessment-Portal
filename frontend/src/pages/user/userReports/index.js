import React, { useEffect, useState } from 'react';
import {Table, message} from 'antd';
import {useDispatch,useSelector} from 'react-redux';
import PageTitles from '../../../component/PageTitles';
import { HideLoading, ShowLoading } from '../../../redux/loaderSlice';
import { getAllReportsByUser } from '../../../apiCalls/reports';
import { useNavigate } from 'react-router-dom';
import { useNavigationMenu } from '../../../hooks/useNavigationMenu';

import moment from 'moment';
function UserReports({children}) {
    const [reportsData,setReportsData]=useState([]);
    const dispatch = useDispatch();
    const {user}=useSelector((state)=> state.users);
    const [menu,setMenu] = useState([]);
    const [collapsed,setCollapsed] = useState();
    const navigate=useNavigate();
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


        const getData= async() =>{
          try {
              dispatch(ShowLoading());
               const response = await getAllReportsByUser();
               if(response.success){
                  setReportsData(response.data);
               }else{
                  message.error(response.message);
               }
              dispatch(HideLoading());         
          } catch (error) {
              dispatch(HideLoading());
              message.error(error.message);   
          }
      }
    //         {
    //             title:"Exam Name",
    //             dataIndex: "examName",
    //             render: (text , record)=> <> {record.exam.name}</>    
    //         },
    //         {
    //             title:"Date",
    //             dataIndex: "date",
    //             className:"Colhide",
    //             render: (text , record)=> <> { moment(record.createdAt).format("DD-MM-YYYY hh:mm")}</>
    //         },
    //         {
    //             title:'Total Marks',
    //             dataIndex: "totalMarks",
    //             render: (text , record)=> <> {record.exam.totalMark}</>
    //         },
    //         {
    //             title:'Passing Marks',
    //             dataIndex: "passingMarks",
    //             render: (text , record)=> <> {record.exam.passingMark}</>
    //         },

    //         {
    //             title:"Obtain Mark",
    //             dataIndex: "score",
    //             render: (text , record)=> <> {record.result.correctAnswers.length}</>
    //         },
    //         {
    //             title:"Verdict",
    //             dataIndex: "verdict",
    //             className:"Colhide",
    //             render: (text , record)=> <> {record.result.verdict}</>
    //         }
    // ];
    const columns = [
      {
        title: "Exam Name",
        dataIndex: "exam",
        render: (text, record) => <> {record.exam ? record.exam.name : 'N/A'}</>
      },
      {
        title: "Date",
        dataIndex: "createdAt",
        className: "Colhide",
        render: (text, record) => <> {moment(record.createdAt).format("DD-MM-YYYY hh:mm")}</>
      },
      {
        title: 'Total Marks',
        dataIndex: "exam",
        render: (text, record) => <> {record.exam ? record.exam.totalMark : 'N/A'}</>
      },
      {
        title: 'Passing Marks',
        dataIndex: "exam",
        render: (text, record) => <> {record.exam ? record.exam.passingMark : 'N/A'}</>
      },
      {
        title: "Obtain Mark",
        dataIndex: "result",
        render: (text, record) => <> {record.result ? record.result.correctAnswers.length : 'N/A'}</>
      },
      {
        title: "Verdict",
        dataIndex: "result",
        className: "Colhide",
        render: (text, record) => <> {record.result ? record.result.verdict : 'N/A'}</>
      }
    ];
    
  useEffect(()=>{
        getData();
    },
    [])
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
                  <div className="user-reports-section">
                    <PageTitles title="Reports" />
                    <div className="divider mt-2"></div>
                    <div className="reports">
                      <Table
                        columns={columns}
                        dataSource={reportsData}
                        pagination={{ pageSize: 6 }}
                        className="modern-table"
                      />
                    </div>
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

export default UserReports;