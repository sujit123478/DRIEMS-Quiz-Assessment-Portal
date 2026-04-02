import React, { useState ,useEffect } from 'react'
import {  getAllReports } from '../../../apiCalls/reports';
import * as XLSX from 'xlsx';
import {useSelector} from 'react-redux';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useNavigationMenu } from '../../../hooks/useNavigationMenu';
import PageTitles from '../../../component/PageTitles';
function DownloadReports({children}) {
  const {user}=useSelector((state)=> state.users);
  const [menu,setMenu] = useState([]);
  const [collapsed,setCollapsed] = useState();
  const navigate=useNavigate();
  const dispatch = useDispatch();
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




  const [filters, setFilters] = useState({
    examName: "",
    userName: ""
  });
  const fetchedReports = async () => {
    const userReports=[];
    const response = await getAllReports(filters);
    if (response.success) {
      const reports = response.data;
      reports.forEach(report => {
      const User_Name = report.user.name;
      const Registration_Number=report.user.RegistrationNumber;
      const Total_Mark = report.exam.totalMark;
      const Passing_Mark = report.exam.passingMark;
      const Correct_AnswersCount = report.result.correctAnswers.length;
      const Wrong_AnswersCount = report.result.wrongAnswers.length;
      const Obtain_Mark = Correct_AnswersCount;
      const Result = report.result.verdict;
      const resultObject = {
        User_Name,
        Registration_Number,
        Total_Mark,
        Passing_Mark,
        Obtain_Mark,
        Result,
      };
      userReports.push(resultObject)
      });

     generateExcelFile(userReports);
    }
    
  }
  const generateExcelFile = (data) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reports');
    // Save the workbook as an Excel file
    XLSX.writeFile(wb, 'userReports.xlsx');
    
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
                  <div className="download-reports-section">
                    <PageTitles title="Download Reports" />
                    <div className="divider mt-2"></div>
                    <div className="flex flex-col gap-2 mt-2">
                      <label>Enter Exam Name</label>
                      <input
                        type="text"
                        placeholder="Exam Name"
                        value={filters.examName}
                        onChange={(e) =>
                          setFilters({ ...filters, examName: e.target.value })
                        }
                        className="filter-input"
                      />
                      <button
                        className="gen-btn"
                        onClick={() => {
                          fetchedReports();
                        }}
                      >
                        Generate Report
                      </button>
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

export default DownloadReports