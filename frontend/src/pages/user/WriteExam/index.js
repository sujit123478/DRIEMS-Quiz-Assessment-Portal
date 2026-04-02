import {message} from "antd";
import React, {useEffect, useState, useCallback, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";
import {useNavigate, useParams} from "react-router-dom";
import {HideLoading, ShowLoading} from "../../../redux/loaderSlice";
import {getExamById} from "../../../apiCalls/exams";
import Instruction from "./Instruction";
import {addReport} from "../../../apiCalls/reports";
import {addCheatingEvent} from "../../../apiCalls/cheating";
import {useNavigationMenu} from "../../../hooks/useNavigationMenu";
import * as faceapi from "face-api.js";


function WriteExam({children}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();
  const [examData, setExamData] = useState();
  const [view, setView] = useState("instructions");
  const [result, setResult] = useState({
    correctAnswers: [],
    wrongAnswers: [],
    verdict: "",
  });
  const [questions = [], setQuestions] = useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState({});
  const [secondLeft, setSecondLeft] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const {user} = useSelector((state) => state.users);
  const [menu, setMenu] = useState([]);
  const [collapsed, setCollapsed] = useState();
  const {userMenu, adminMenu, getUserData, getIsActiveOrNot} =
    useNavigationMenu();
  const videoRef = useRef(null);
  const faceIntervalRef = useRef(null);
  const lastNosePositionRef = useRef(null);
  const missingFaceCountRef = useRef(0);
  const [detectionStatus, setDetectionStatus] = useState(
    "Waiting for webcam initialization..."
  );
  const [warningCount, setWarningCount] = useState(0);
  const [lastWarning, setLastWarning] = useState("None yet");
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);
  const [isProctoring, setIsProctoring] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      getUserData().then((userData) => {
        if (userData?.isAdmin) {
          setMenu(adminMenu);
        } else {
          setMenu(userMenu);
        }
      });
    } else {
      navigate("/login");
    }
  }, [adminMenu, getUserData, navigate, userMenu]);

  const getExamData = useCallback(async () => {
    try {
      dispatch(ShowLoading());
      const response = await getExamById({
        examId: params.id,
      });
      dispatch(HideLoading());
      if (response.success) {
        setExamData(response.data);
        setQuestions(response.data.questions);
        setSecondLeft(response.data.duration);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  }, [dispatch, params.id]);

  const reportCheatingEvent = useCallback(
    async (type, detail) => {
      setWarningCount((prev) => prev + 1);
      setLastWarning(detail);
      setDetectionStatus(detail);
      try {
        await addCheatingEvent({
          exam: params.id,
          type,
          detail,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Cheating event log failed", error);
      }
    },
    [params.id]
  );

  const loadFaceModels = useCallback(async () => {
    if (faceModelsLoaded) return true;
    try {
      const modelPath = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelPath);
      setFaceModelsLoaded(true);
      setDetectionStatus("Face detection models loaded");
      return true;
    } catch (error) {
      console.error("Model load error:", error);
      setDetectionStatus("Failed to load models. Check /models folder");
      return false;
    }
  }, [faceModelsLoaded]);

  const startWebcam = useCallback(async () => {
    if (!videoRef.current) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setDetectionStatus("Webcam active");
      return true;
    } catch (error) {
      setDetectionStatus("Webcam access denied");
      message.error("Webcam access is required for exam proctoring.");
      return false;
    }
  }, []);

  const stopProctoring = useCallback(() => {
    if (!isProctoring) {
      return;
    }
    if (faceIntervalRef.current) {
      clearInterval(faceIntervalRef.current);
      faceIntervalRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsProctoring(false);
    setDetectionStatus("Proctoring stopped");
  }, [isProctoring]);

  const startProctoring = useCallback(async () => {
    const modelsLoaded = await loadFaceModels();
    if (!modelsLoaded) return false;
    const webcamStarted = await startWebcam();
    if (!webcamStarted) {
      setDetectionStatus("Webcam access required");
      return false;
    }
    const detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.25,
    });
    const initialDetections = await faceapi
      .detectAllFaces(videoRef.current, detectorOptions)
      .withFaceLandmarks(true);
    if (!initialDetections.length) {
      setDetectionStatus("No face detected. Adjust camera.");
      stopProctoring();
      return false;
    }
    setDetectionStatus("Proctoring started");
    setIsProctoring(true);
    faceIntervalRef.current = setInterval(async () => {
      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, detectorOptions)
          .withFaceLandmarks(true);
        if (!detections.length) {
          missingFaceCountRef.current++;
          if (missingFaceCountRef.current >= 4) {
            reportCheatingEvent("no_face", "No face detected");
          }
          return;
        }
        missingFaceCountRef.current = 0;
        if (detections.length > 1) {
          reportCheatingEvent("multiple_faces", "Multiple faces detected");
          return;
        }
        const nose = detections[0].landmarks.getNose()[3];
        const current = {x: nose.x, y: nose.y};
        if (lastNosePositionRef.current) {
          const dx = Math.abs(current.x - lastNosePositionRef.current.x);
          const dy = Math.abs(current.y - lastNosePositionRef.current.y);
          if (dx > 45 || dy > 45) {
            reportCheatingEvent("head_movement", "Suspicious head movement");
          }
        }
        lastNosePositionRef.current = current;
      } catch (err) {
        console.error("Detection error:", err);
      }
    }, 2000);
    return true;
  }, [loadFaceModels, startWebcam, reportCheatingEvent, stopProctoring]);

  useEffect(() => {
    if (view !== "questions" && isProctoring) {
      stopProctoring();
    }
  }, [view, stopProctoring, isProctoring]);

  useEffect(() => {
    return () => {
      stopProctoring();
    };
  }, [stopProctoring]);

  useEffect(() => {
    if (view !== "questions") {
      return;
    }
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportCheatingEvent(
          "tab_switch",
          "Browser tab hidden or switched away"
        );
      }
    };
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const blocked =
        e.key === "PrintScreen" ||
        e.key === "F12" ||
        (ctrl && key === "f") ||
        (ctrl && key === "r") ||
        (ctrl && key === "p") ||
        (ctrl && key === "s") ||
        (ctrl && e.shiftKey && ["i", "j", "c", "u"].includes(key));
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        setDetectionStatus("Shortcut blocked during exam");
        return false;
      }
    };
    const handleContextMenu = (e) => {
      e.preventDefault();
      setDetectionStatus("Right-click blocked during exam");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [reportCheatingEvent, view]);

  const calculateResults = useCallback(async () => {
    try {
      let correctAnswers = [];
      let wrongAnswers = [];
      questions.forEach((question, index) => {
        if (question.correctOption === selectedOption[index]) {
          correctAnswers.push(question);
        } else {
          wrongAnswers.push(question);
        }
      });
      let verdict = "fail";
      if (correctAnswers.length >= examData.passingMark) {
        verdict = "pass";
      }
      const tempResults = {
        correctAnswers,
        wrongAnswers,
        verdict,
      };
      setResult(tempResults);
      const userId = user?._id || user?.id;
      if (!userId) {
        dispatch(HideLoading());
        return message.error("User not available. Please log in again.");
      }
      dispatch(ShowLoading());
      const response = await addReport({
        exam: params.id,
        result: tempResults,
        user: userId,
        warningCount,
      });
      dispatch(HideLoading());
      if (response.success) {
        setView("result");
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  }, [
    questions,
    selectedOption,
    examData,
    params.id,
    user,
    dispatch,
    warningCount,
  ]);

  const startTimer = useCallback(() => {
    let remainingSeconds = examData.duration;
    const id = setInterval(() => {
      if (remainingSeconds > 0) {
        remainingSeconds = remainingSeconds - 1;
        setSecondLeft(remainingSeconds);
      } else {
        clearInterval(id);
        setTimeUp(true);
      }
    }, 1000);
    setIntervalId(id);
  }, [examData]);

  const handleStartExam = useCallback(async () => {
    const started = await startProctoring();
    if (!started) {
      return;
    }
    startTimer();
    setView("questions");
  }, [startProctoring, startTimer]);

  useEffect(() => {
    if (timeUp && intervalId) {
      clearInterval(intervalId);
      calculateResults();
    }
  }, [timeUp, intervalId, calculateResults]);

  useEffect(() => {
    if (view !== "questions") {
      stopProctoring();
    }
    return () => {
      stopProctoring();
    };
  }, [view, stopProctoring]);

  useEffect(() => {
    if (params.id) {
      getExamData();
    }
  }, [params.id, getExamData]);

  return (
    examData && (
      <div className="writeExamBox">
        <div className="layout">
          <div className="sidebar-panel">
            {collapsed && (
              <div className="modern-sidebar">
                <div className="sidebar-header">
                  <div className="sidebar-header-content">
                    <h3>Navigation</h3>
                    <div className="sidebar-close-mobile">
                      <i
                        className="ri-close-line toggle-icon"
                        onClick={() => setCollapsed(false)}
                      ></i>
                    </div>
                  </div>
                </div>
                <div className="menu-list">
                  {menu.map((item, index) => {
                    return (
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
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="main-panel">
            <div className="body">
              <div className="header flex justify-between">
                {!collapsed && (
                  <i
                    className="ri-menu-line"
                    onClick={() => {
                      setCollapsed(true);
                    }}
                  ></i>
                )}
                {collapsed && (
                  <i
                    className="ri-close-line"
                    onClick={() => {
                      setCollapsed(false);
                    }}
                  ></i>
                )}
                <h1 className="text-2xl">DRIEMS Quiz Assessment Portal</h1>
                <div className="flex flex-col">
                  <div className="flex gap-1 item-center ">
                    <i className="ri-user-line"></i>
                    <h1 className="text-xl">{user?.name}</h1>
                  </div>
                  <span>Role : {user?.isAdmin ? "Admin" : "User"}</span>
                </div>
              </div>
              <div className="content">{children}</div>
              <div className={`home ${collapsed ? `homeHide` : ``}`}>
                <div className="exam-title-section">
                  <h1>{examData.name}</h1>
                  <p className="exam-subtitle">
                    Complete your exam with live proctoring enabled. Stay
                    focused, keep your camera on, and answer confidently.
                  </p>
                </div>
                {view === "instructions" && (
                  <Instruction
                    examData={examData}
                    view={view}
                    setView={setView}
                    startExam={handleStartExam}
                    detectionStatus={detectionStatus}
                  />
                )}
                <div className="proctoring-panel">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="proctor-video"
                    style={{display: view === "questions" ? "block" : "none"}}
                  />
                  <div className="proctor-status">
                    <h3>Proctoring Status</h3>
                    <p className="proctor-status-line">
                      Proctoring: {detectionStatus} · Warnings:{" "}
                      <strong>{warningCount}</strong> · Last: {lastWarning}
                    </p>
                  </div>
                </div>
                {view === "questions" && (
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex justify-between">
                      <h1 className="text-2xl">
                        {selectedQuestionIndex + 1} :{" "}
                        {questions[selectedQuestionIndex].name}
                      </h1>
                      <div className="timer">
                        <h1 className="text-2xl">{secondLeft}</h1>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {Object.keys(
                        questions[selectedQuestionIndex].options
                      ).map((option, index) => {
                        return (
                          <div
                            className={`flex gap-2 flex-col ${
                              selectedOption[selectedQuestionIndex] === option
                                ? "selected-option"
                                : "option"
                            }`}
                            key={index}
                            onClick={() => {
                              setSelectedOption({
                                ...selectedOption,
                                [selectedQuestionIndex]: option,
                              });
                            }}
                          >
                            <h2>
                              {option}:
                              {questions[selectedQuestionIndex].options[option]}
                            </h2>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between">
                      {selectedQuestionIndex > 0 && (
                        <button
                          className="primary-outlined-btn"
                          onClick={() => {
                            setSelectedQuestionIndex(selectedQuestionIndex - 1);
                          }}
                        >
                          previous
                        </button>
                      )}
                      {selectedQuestionIndex < questions.length - 1 && (
                        <button
                          className="primary-contend-btn"
                          onClick={() => {
                            setSelectedQuestionIndex(selectedQuestionIndex + 1);
                          }}
                        >
                          Next
                        </button>
                      )}
                      {selectedQuestionIndex === questions.length - 1 && (
                        <button
                          className="primary-contend-btn"
                          onClick={() => {
                            clearInterval(intervalId);
                            setTimeUp(true);
                          }}
                        >
                          Submit
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {view === "result" && (
                  <div className="flex justify-center mt-2 item-center">
                    <div className="flex flex-col gap-2 result">
                      <h1 className="text-2xl">Result</h1>
                      <div className="mark">
                        <h1 className="text-md">
                          Total Marks : {examData.totalMark}{" "}
                        </h1>
                        <h1 className="text-md">
                          Obtain Marks : {result.correctAnswers.length}
                        </h1>
                        <h1 className="text-md">
                          wrongAnswers Marks : {result.wrongAnswers.length}
                        </h1>
                        <h1 className="text-md">
                          Passing Mark : {examData.passingMark}
                        </h1>
                        <h1 className="text-md">VERDICT : {result.verdict} </h1>
                        <div className="mt-2 flex gap-2">
                          <button
                            className="primary-contend-btn"
                            onClick={() => {
                              setView("review");
                            }}
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                    </div>
                   
                  </div>
                )}
                {view === "review" && (
                  <div className="flex flex-col gap-2">
                    {questions.map((questions, index) => {
                      const isCorrect =
                        questions.correctOption === selectedOption[index];
                      return (
                        <div
                          className={`flex flex-col gap-1 p-2 card ${
                            isCorrect ? "correct" : "wrong"
                          }`}
                        >
                          <h1 className="text-xl">
                            {index + 1}:{questions.name}
                          </h1>
                          <h1 className="text-md">
                            Submited Answer :{selectedOption[index]} -{" "}
                            {questions.options[selectedOption[index]]}
                          </h1>
                          <h1 className="text-md">
                            Correct Answers :{questions.correctOption} -{" "}
                            {questions.options[questions.correctOption]}
                          </h1>
                        </div>
                      );
                    })}
                    <div className="flex justify-center gap-2">
                      <button
                        className="primary-outlined-btn"
                        onClick={() => {
                          navigate("/");
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>{" "}
        </div>
      </div>
    )
  );
}

export default WriteExam;
