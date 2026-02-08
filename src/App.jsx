import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('study-plan');
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef(null);

  // Data
  const examSchedule = [
    { date: "2026-03-02", day: "Mon", subject: "Drawing Assmt", syllabus: "During school hours. Bring colors.", type: "assessment" },
    { date: "2026-03-03", day: "Tue", subject: "Study Leave", syllabus: "Preparation time at home.", type: "holiday" },
    { date: "2026-03-04", day: "Wed", subject: "Holiday (Dhuleti)", syllabus: "Festival Holiday", type: "holiday" },
    { date: "2026-03-05", day: "Thu", subject: "English", syllabus: "Ch-9 to 15, Writing Skills", type: "exam" },
    { date: "2026-03-06", day: "Fri", subject: "Hindi", syllabus: "Ch-9 to 14, Grammar (Gender, Number, Opposites, Synonyms), Writing Skills", type: "exam" },
    { date: "2026-03-07", day: "Sat", subject: "Gujarati", syllabus: "Vocab, Numbers 1-100, Categories (Colors, Animals, etc.)", type: "exam" },
    { date: "2026-03-08", day: "Sun", subject: "Holiday", syllabus: "Sunday Break", type: "holiday" },
    { date: "2026-03-09", day: "Mon", subject: "Math", syllabus: "Ch-7 to 10, 12 to 14", type: "exam" },
    { date: "2026-03-10", day: "Tue", subject: "Computer", syllabus: "Ch-5 to 8", type: "exam" },
    { date: "2026-03-11", day: "Wed", subject: "EVS", syllabus: "Ch-12, 14, 16, 17, 19, 20, 22", type: "exam" }
  ];

  const syllabusDetails = {
    "English": ["Ch-9", "Ch-10", "Ch-11", "Ch-12", "Ch-13", "Ch-14", "Ch-15", "Writing Skills"],
    "Math": ["Ch-7", "Ch-8", "Ch-9", "Ch-10", "Ch-12", "Ch-13", "Ch-14"],
    "Hindi": ["Ch-9", "Ch-10", "Ch-11", "Ch-12", "Ch-13", "Ch-14", "Grammar & Writing"],
    "EVS": ["Ch-12", "Ch-14", "Ch-16", "Ch-17", "Ch-19", "Ch-20", "Ch-22"],
    "Computer": ["Ch-5", "Ch-6", "Ch-7", "Ch-8"],
    "Gujarati": ["Vocab (Matravagar/Matravala)", "Numbers 1-100", "Words 1-20", "Categories: Flowers/Veg", "Categories: Animals/Birds", "Colors & Directions", "Jodakshar"]
  };

  const colors = {
    'English': 'var(--primary)',
    'Math': 'var(--success)',
    'Hindi': 'var(--danger)',
    'Gujarati': 'var(--warning)',
    'Computer': 'var(--accent)',
    'EVS': 'var(--secondary)'
  };

  // Logic to generate tasks
  useEffect(() => {
    // Load progress from local storage
    const savedProgress = JSON.parse(localStorage.getItem('h3exam_progress')) || {};

    // Generate Plan logic
    // We want 1 Subject 1 Chapter per day strictly.
    // We need to sequence them by priority (Exam Date) and rotate subjects?
    // User said: "daily 1 subject 1 chep onlly".

    // Create a flat list of all tasks with their due exams
    let allTasks = [];

    // Helper to find exam date for a subject
    const getExamDate = (sub) => {
      const exam = examSchedule.find(e => e.subject === sub);
      return exam ? new Date(exam.date) : new Date('2026-04-01');
    };

    // Populate allTasks
    Object.entries(syllabusDetails).forEach(([subject, topics]) => {
      topics.forEach(topic => {
        allTasks.push({
          subject,
          topic,
          examDate: getExamDate(subject)
        });
      });
    });

    // Strategy 1: Interleave subjects but respect exam order.
    // If we just sort by Exam Date, we might get 5 days of English, then 5 days of Hindi.
    // User might want variety (Rotation).
    // Let's create a rotation order: Math, Eng, EVS, Hindi, Comp, Guj
    // And pick the next available topic for that subject.

    const subjectOrder = ['Math', 'English', 'EVS', 'Hindi', 'Computer', 'Gujarati'];
    let organizedTasks = [];
    let subjectIndices = { 'Math': 0, 'English': 0, 'EVS': 0, 'Hindi': 0, 'Computer': 0, 'Gujarati': 0 };

    // We have ~40 tasks.
    let safetyCounter = 0;
    while (organizedTasks.length < allTasks.length && safetyCounter < 100) {
      subjectOrder.forEach(sub => {
        const topics = syllabusDetails[sub];
        if (topics && subjectIndices[sub] < topics.length) {
          organizedTasks.push({
            subject: sub,
            topic: topics[subjectIndices[sub]],
            examDate: getExamDate(sub)
          });
          subjectIndices[sub]++;
        }
      });
      safetyCounter++;
    }

    // Now map organizedTasks to dates starting Feb 9
    const startDate = new Date('2026-02-09');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mappedTasks = organizedTasks.map((task, index) => {
      const taskDate = new Date(startDate);
      taskDate.setDate(startDate.getDate() + index);

      const isToday = taskDate.toDateString() === today.toDateString();
      const dateKey = taskDate.toISOString().split('T')[0];
      const items = [{ ...task, id: `${dateKey}-${task.subject}` }]; // Wrap in array to keep structure consistent if we ever expand

      return {
        date: taskDate,
        dateString: taskDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isToday,
        isPast: taskDate < today,
        items: items,
        dateKey: dateKey
      };
    });

    setTasks(mappedTasks);

    // Calculate initial progress
    calculateProgress(mappedTasks, savedProgress);

  }, []);

  // Update progress
  const toggleTask = (taskId) => {
    const savedProgress = JSON.parse(localStorage.getItem('h3exam_progress')) || {};
    // Toggle
    if (savedProgress[taskId]) {
      delete savedProgress[taskId];
    } else {
      savedProgress[taskId] = true;
    }

    localStorage.setItem('h3exam_progress', JSON.stringify(savedProgress));
    calculateProgress(tasks, savedProgress);
  };

  const calculateProgress = (currentTasks, savedProgress) => {
    let total = 0;
    let completed = 0;
    currentTasks.forEach(day => {
      day.items.forEach(item => {
        total++;
        if (savedProgress[item.id]) completed++;
      });
    });
    setProgress(total === 0 ? 0 : Math.round((completed / total) * 100));
  };

  // Scroll to today
  useEffect(() => {
    if (activeTab === 'study-plan' && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [activeTab, tasks]);

  // Render Helpers
  const isChecked = (taskId) => {
    const savedProgress = JSON.parse(localStorage.getItem('h3exam_progress')) || {};
    return !!savedProgress[taskId];
  };

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="header-content">
          <h1>H3 World School, Tragad</h1>
          <p>SA-2 Exam Portal & Planner (Grade II)</p>
        </div>
        <div className="header-actions">
          <p className="current-date">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      <main>
        <nav className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'timetable' ? 'active' : ''}`}
            onClick={() => setActiveTab('timetable')}
          >
            <span className="icon">📅</span> Exam Schedule
          </button>
          <button
            className={`tab-btn ${activeTab === 'study-plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('study-plan')}
          >
            <span className="icon">📝</span> Daily Study Plan
          </button>
        </nav>

        {activeTab === 'timetable' && (
          <section className="tab-content active">
            <div className="notice-board" style={{ marginBottom: '20px' }}>
              <h3>📢 Instructions</h3>
              <ul>
                <li>Report: 8:25 am | Leave: 12:10 pm</li>
                <li>Send Compass box, Heavy Nashta, Water bottle only.</li>
                <li>Drawing Exam: 02/03/26 (Mon).</li>
              </ul>
            </div>
            <div className="schedule-card-container">
              {examSchedule.map((item, idx) => (
                <div key={idx} className={`exam-card border-${item.subject.toLowerCase() === 'study leave' || item.subject.includes('Holiday') ? 'holiday' : item.subject === 'Math' ? 'math' : item.subject === 'English' ? 'english' : item.subject === 'Hindi' ? 'hindi' : item.subject === 'Gujarati' ? 'gujarati' : item.subject === 'Computer' ? 'comp' : item.subject === 'EVS' ? 'evs' : 'holiday'}`}>
                  <div className="exam-date-box">
                    <span className="exam-day">{item.day}</span>
                    <span className="exam-date">{new Date(item.date).getDate()}</span>
                  </div>
                  <div className="exam-details">
                    <div className="exam-subject" style={{ color: 'var(--text-main)' }}>{item.subject}</div>
                    <div className="exam-syllabus">{item.syllabus}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'study-plan' && (
          <section className="tab-content active">
            <div className="plan-header">
              <h2>Daily Goal: 1 Subject, 1 Chapter</h2>
            </div>
            <div className="progress-container">
              <div className="progress-bar-bg">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="progress-text">Readiness: {progress}%</p>
            </div>

            <div className="study-timeline">
              {tasks.map((day, idx) => (
                <div
                  key={idx}
                  ref={day.isToday ? scrollRef : null}
                  className={`study-day-card ${day.isToday ? 'today' : ''} ${day.isPast ? 'completed' : ''}`}
                >
                  <div className="study-date-header">
                    <span className="study-date">{day.dateString}</span>
                    <span className="study-status">
                      {day.isPast ? 'Past' : (day.isToday ? "Today's Target" : 'Upcoming')}
                    </span>
                  </div>
                  <div className="study-tasks">
                    {day.items.map(task => (
                      <label key={task.id} className="task-item" style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          className="task-checkbox"
                          checked={isChecked(task.id)}
                          onChange={() => toggleTask(task.id)}
                        />
                        <div className="task-content">
                          <div className="task-subject" style={{ color: colors[task.subject] }}>
                            {task.subject}
                          </div>
                          <div className="task-desc">
                            Study {task.topic}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      <footer>
        <p>Good Luck for SA-2!</p>
      </footer>
    </div>
  )
}

export default App
