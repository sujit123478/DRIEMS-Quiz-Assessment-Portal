import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useCallback, useMemo } from 'react';
import { HideLoading, ShowLoading } from '../redux/loaderSlice';
import { getUserInfo } from '../apiCalls/user';
import { setUser } from '../redux/userSlice';
import { message } from 'antd';

export const useNavigationMenu = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const userMenu = useMemo(() => [
    {
      title: "Home",
      path: ['/', '/user/write-exam'],
      icon: <i className="ri-home-line"></i>,
      onClick: () => navigate("/")
    },
    {
      title: "Reports",
      path: ['/user/reports'],
      icon: <i className="ri-bar-chart-line"></i>,
      onClick: () => navigate("/user/reports")
    },
    {
      title: "Profile",
      path: ["/profile"],
      icon: <i className="ri-user-line"></i>,
      onClick: () => navigate("/profile")
    },
    {
      title: "Logout",
      path: ["/logout"],
      icon: <i className="ri-logout-circle-line"></i>,
      onClick: () => {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  ], [navigate]);

  const adminMenu = useMemo(() => [
    {
      title: "Home",
      path: ['/', '/user/write-exam'],
      icon: <i className="ri-home-line"></i>,
      onClick: () => navigate("/")
    },
    {
      title: "Exam",
      path: ['/admin/exams', '/admin/exams/add'],
      icon: <i className="ri-file-list-line"></i>,
      onClick: () => navigate("/admin/exams")
    },
    {
      title: "Reports",
      path: ['/admin/reports'],
      icon: <i className="ri-bar-chart-line"></i>,
      onClick: () => navigate("/admin/reports")
    },
    {
      title: "Profile",
      path: ["/profile"],
      icon: <i className="ri-user-line"></i>,
      onClick: () => navigate("/profile")
    },
    {
      title: "Logout",
      path: ["/logout"],
      icon: <i className="ri-logout-circle-line"></i>,
      onClick: () => {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  ], [navigate]);

  const getUserData = useCallback(async () => {
    try {
      dispatch(ShowLoading());
      const response = await getUserInfo();
      dispatch(HideLoading());
      if (response.success) {
        message.success(response.message);
        dispatch(setUser(response.data));
        return response.data;
      } else {
        navigate('/login');
        return null;
      }
    } catch (error) {
      navigate('/login');
      dispatch(HideLoading());
      message.error(error.message);
      return null;
    }
  }, [dispatch, navigate]);

  const getIsActiveOrNot = useCallback((paths) => {
    const activeRoute = window.location.pathname;
    if (paths.includes(activeRoute)) {
      return true;
    }
    if (activeRoute.includes('/admin/exams/edit') && paths.includes('/admin/exams')) {
      return true;
    }
    if (activeRoute.includes('/user/write-exam') && paths.includes('/user/write-exam')) {
      return true;
    }
    return false;
  }, []);

  return {
    userMenu,
    adminMenu,
    getUserData,
    getIsActiveOrNot
  };
};