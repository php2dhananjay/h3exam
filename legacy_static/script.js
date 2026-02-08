// Data Source
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
    "English": [
        "Ch-9", "Ch-10", "Ch-11", "Ch-12", "Ch-13", "Ch-14", "Ch-15", "Writing Skills Practice"
    ],
    "Math": [
        "Ch-7", "Ch-8", "Ch-9", "Ch-10", "Ch-12", "Ch-13", "Ch-14"
    ],
    "Hindi": [
        "Ch-9", "Ch-10", "Ch-11", "Ch-12", "Ch-13", "Ch-14", "Grammar & Writing"
    ],
    "EVS": [
        "Ch-12", "Ch-14", "Ch-16", "Ch-17", "Ch-19", "Ch-20", "Ch-22"
    ],
    "Computer": [
        "Ch-5", "Ch-6", "Ch-7", "Ch-8"
    ],
    "Gujarati": [
        "Vocab (Matravagar/Matravala)", "Numbers 1-100", "Words 1-20", "Categories: Flowers/Veg", "Categories: Animals/Birds", "Colors & Directions", "Jodakshar"
    ]
};

const instructions = [
    "Reporting time: Regular (8:25 am)",
    "Leaving time: 12:10 pm",
    "No books - Send only Compass box, Heavy Nashta, Water bottle and Almanac.",
    "Canteen facility available for Brunch (Heavy Nashta).",
    "No preponing or postponing of assessments.",
    "Drawing Assessment on 02/03/26 (Monday) during school hours. Bring colors."
];

// App Logic
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    renderCurrentDate();
    renderSchedule();
    renderInstructions();
    generateStudyPlan();
    setupTabs();
}

function renderCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateEl = document.getElementById('currentDateDisplay');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', options);
}

function renderInstructions() {
    const list = document.getElementById('instructionsList');
    if (!list) return;
    list.innerHTML = '';
    instructions.forEach(inst => {
        const li = document.createElement('li');
        li.textContent = inst;
        list.appendChild(li);
    });
}

function renderSchedule() {
    const container = document.getElementById('examScheduleContainer');
    if (!container) return;
    container.innerHTML = '';

    examSchedule.forEach(item => {
        const card = document.createElement('div');
        let borderColorClass = '';

        // Subject to Border Mapping
        switch (item.subject) {
            case 'English': borderColorClass = 'border-english'; break;
            case 'Hindi': borderColorClass = 'border-hindi'; break;
            case 'Math': borderColorClass = 'border-math'; break;
            case 'Gujarati': borderColorClass = 'border-gujarati'; break;
            case 'Computer': borderColorClass = 'border-comp'; break;
            case 'EVS': borderColorClass = 'border-evs'; break;
            default: borderColorClass = 'border-holiday';
        }

        // Overrides for holidays
        if (item.type === 'holiday' || item.subject.includes('Holiday') || item.subject === 'Study Leave') {
            borderColorClass = 'border-holiday';
        }

        // Add specific class for valid subjects
        card.className = `exam-card ${borderColorClass}`;

        const dateObj = new Date(item.date);
        const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const dateNum = dateObj.getDate();

        // Optional: Highlight today if date matches
        const isToday = new Date().toDateString() === dateObj.toDateString();
        if (isToday) card.style.borderLeftWidth = '8px';

        card.innerHTML = `
            <div class="exam-date-box">
                <span class="exam-day">${day}</span>
                <span class="exam-date">${dateNum}</span>
            </div>
            <div class="exam-details">
                <div class="exam-subject">${item.subject}</div>
                <div class="exam-syllabus">${item.syllabus}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

function generateStudyPlan() {
    // Strategy: Balanced Mix of Subjects
    // We want to interleave: (Math/English), (EVS/Hindi), (Computer/Gujarati)
    // This creates a sustainable 40-50 min daily load.

    let pairs = [
        ['Math', 'English'],
        ['EVS', 'Hindi'],
        ['Computer', 'Gujarati']
    ];

    // Create a robust task queue
    let taskQueue = [];

    // Determine the max number of "rounds" needed based on the longest syllabus
    let maxTopics = 0;
    Object.values(syllabusDetails).forEach(list => {
        if (list.length > maxTopics) maxTopics = list.length;
    });

    // Populate queue by cycling through pairs
    for (let i = 0; i < maxTopics; i++) {
        // Round i
        pairs.forEach(pair => { // 0, 1, 2
            // Pair [Subj1, Subj2]
            let dayTasks = [];

            // Try to get topic i from Subj1
            if (syllabusDetails[pair[0]] && syllabusDetails[pair[0]][i]) {
                dayTasks.push({ subject: pair[0], topic: syllabusDetails[pair[0]][i] });
            }

            // Try to get topic i from Subj2
            if (syllabusDetails[pair[1]] && syllabusDetails[pair[1]][i]) {
                dayTasks.push({ subject: pair[1], topic: syllabusDetails[pair[1]][i] });
            }

            if (dayTasks.length > 0) {
                taskQueue.push(dayTasks);
            }
        });
    }

    // Now taskQueue is an array of ARRAYS (each inner array is a day's work)
    // Map these to calendar dates starting Feb 9

    const startDate = new Date('2026-02-09');
    const today = new Date();
    const timelineContainer = document.getElementById('studyTimeline');
    if (!timelineContainer) return;
    timelineContainer.innerHTML = '';

    let dayOffset = 0;

    taskQueue.forEach((daysWork, index) => {
        let planDate = new Date(startDate);
        planDate.setTime(planDate.getTime() + (dayOffset * 86400000)); // Add days safely

        // Skip Sundays from STUDY plan if we want rest? 
        // User requested "daily planing". Usually exams need Sunday study. We keep it.
        // But let's check if it conflicts with an exam day.
        // Exam starts March 5. Drawing is March 2.
        // Feb has 28 days in 2026.

        // Stop if date > March 2
        if (planDate >= new Date('2026-03-03')) return;

        const isToday = planDate.toDateString() === today.toDateString();
        const isPast = planDate < today && !isToday;

        const dayCard = document.createElement('div');
        dayCard.className = `study-day-card ${isToday ? 'today' : ''} ${isPast ? 'completed' : ''}`;

        const dateStr = planDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

        let tasksHtml = daysWork.map(t => {
            const colorVar = getSubjectColorVar(t.subject);
            return `
            <div class="task-item">
                <input type="checkbox" class="task-checkbox" ${isPast ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-subject" style="color: var(--${colorVar})">${t.subject}</div>
                    <div class="task-desc">${t.topic}</div>
                </div>
            </div>`;
        }).join('');

        dayCard.innerHTML = `
            <div class="study-date-header">
                <span class="study-date">${dateStr}</span>
                <span class="study-status">${isPast ? 'Completed' : (isToday ? 'Today\'s Objective' : 'Upcoming')}</span>
            </div>
            <div class="study-tasks">
                ${tasksHtml}
            </div>
        `;
        timelineContainer.appendChild(dayCard);
        dayOffset++;
    });

    // Update Progress Bar
    // Based on completed days vs total planned days
    const totalPlannedDays = taskQueue.length;
    // Calculate days passed since Feb 9
    const diffTime = today - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let percent = 0;

    if (today < startDate) {
        percent = 0;
    } else {
        percent = Math.min(100, Math.round((diffDays / totalPlannedDays) * 100));
        // If diffDays is negative (future start), handled above.
    }

    const fill = document.getElementById('studyProgress');
    const text = document.getElementById('progressPercent');
    if (fill) fill.style.width = `${Math.max(0, percent)}%`;
    if (text) text.textContent = `${Math.max(0, percent)}%`;
}

function getSubjectColorVar(subject) {
    const map = {
        'English': 'primary',
        'Math': 'success',
        'Hindi': 'danger',
        'Gujarati': 'warning',
        'Computer': 'accent',
        'EVS': 'secondary'
    };
    return map[subject] || 'text-muted';
}

function setupTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.currentTarget; // Ensure we get the button, not inner span

            // Remove active
            buttons.forEach(b => b.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Add active
            targetBtn.classList.add('active');
            const tabId = targetBtn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}
