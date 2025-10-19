class HabitTracker {
    constructor() {
        this.habits = this.loadHabits();
        this.currentDate = new Date();
        this.habitRecords = this.loadRecords();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderHabits();
        this.renderCalendar();
        this.updateLegend();
        this.renderTrendChart();
    }

    setupEventListeners() {
        // 습관 추가 버튼
        document.getElementById('addHabitBtn').addEventListener('click', () => {
            this.addHabit();
        });

        // 엔터키로 습관 추가
        document.getElementById('habitName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addHabit();
            }
        });

        // 달력 네비게이션
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.changeMonth(1);
        });
    }

    addHabit() {
        const nameInput = document.getElementById('habitName');
        const colorSelect = document.getElementById('habitColor');
        
        const name = nameInput.value.trim();
        const color = colorSelect.value;
        
        if (!name) {
            alert('습관 이름을 입력해주세요!');
            return;
        }

        if (this.habits.some(habit => habit.name === name)) {
            alert('이미 같은 이름의 습관이 있습니다!');
            return;
        }

        const newHabit = {
            id: Date.now().toString(),
            name: name,
            color: color
        };

        this.habits.push(newHabit);
        this.saveHabits();
        this.renderHabits();
        this.updateLegend();
        
        // 입력 필드 초기화
        nameInput.value = '';
        colorSelect.value = 'blue';
        
        // 성공 메시지
        this.showMessage('새 습관이 추가되었습니다! 🎉');
    }

    deleteHabit(habitId) {
        if (confirm('정말로 이 습관을 삭제하시겠습니까?')) {
            this.habits = this.habits.filter(habit => habit.id !== habitId);
            this.saveHabits();
        this.renderHabits();
        this.updateLegend();
        this.renderCalendar(); // 달력도 다시 렌더링하여 삭제된 습관의 스티커 제거
        this.renderTrendChart(); // 트렌드 차트도 업데이트
        this.showMessage('습관이 삭제되었습니다.');
        }
    }

    renderHabits() {
        const habitsList = document.getElementById('habitsList');
        habitsList.innerHTML = '';

        if (this.habits.length === 0) {
            habitsList.innerHTML = '<p style="text-align: center; color: #a0aec0; padding: 20px;">아직 추가된 습관이 없습니다. 위에서 새 습관을 추가해보세요!</p>';
            return;
        }

        this.habits.forEach(habit => {
            const habitElement = document.createElement('div');
            habitElement.className = 'habit-item';
            habitElement.innerHTML = `
                <div class="habit-info">
                    <div class="habit-color color-${habit.color}"></div>
                    <span class="habit-name">${habit.name}</span>
                </div>
                <button class="delete-habit" onclick="habitTracker.deleteHabit('${habit.id}')">×</button>
            `;
            habitsList.appendChild(habitElement);
        });
    }

    renderCalendar() {
        const calendar = document.getElementById('calendar');
        const currentMonth = document.getElementById('currentMonth');
        
        // 현재 월 표시
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        currentMonth.textContent = `${year}년 ${month + 1}월`;

        // 달력 초기화
        calendar.innerHTML = '';

        // 요일 헤더
        const dayHeaders = ['일', '월', '화', '수', '목', '금', '토'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day;
            calendar.appendChild(dayHeader);
        });

        // 달력 날짜 생성
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            
            // 다른 달의 날짜 스타일
            if (date.getMonth() !== month) {
                dayElement.classList.add('other-month');
            }
            
            // 주말 날짜 스타일 (토요일=6, 일요일=0)
            if (date.getDay() === 0 || date.getDay() === 6) {
                dayElement.classList.add('weekend');
            }
            
            // 오늘 날짜 스타일
            if (isCurrentMonth && date.getDate() === today.getDate()) {
                dayElement.classList.add('today');
            }

            dayElement.innerHTML = `
                <div class="day-number">${date.getDate()}</div>
                <div class="stickers"></div>
            `;

            // 해당 날짜의 습관 기록 표시
            this.renderDayStickers(dayElement, date);

            // 날짜 클릭 이벤트
            dayElement.addEventListener('click', () => {
                this.toggleHabitOnDate(date);
            });

            calendar.appendChild(dayElement);
        }
    }

    renderDayStickers(dayElement, date) {
        const stickersContainer = dayElement.querySelector('.stickers');
        const dateKey = this.getDateKey(date);
        const dayRecords = this.habitRecords[dateKey] || [];

        stickersContainer.innerHTML = '';

        dayRecords.forEach(habitId => {
            const habit = this.habits.find(h => h.id === habitId);
            if (habit) {
                const sticker = document.createElement('div');
                sticker.className = `sticker color-${habit.color}`;
                sticker.title = habit.name;
                stickersContainer.appendChild(sticker);
            }
        });
    }

    toggleHabitOnDate(date) {
        if (this.habits.length === 0) {
            this.showMessage('먼저 습관을 추가해주세요!');
            return;
        }

        const dateKey = this.getDateKey(date);
        if (!this.habitRecords[dateKey]) {
            this.habitRecords[dateKey] = [];
        }

        // 습관 선택 다이얼로그
        const habitNames = this.habits.map(habit => habit.name);
        const selectedHabit = prompt(`어떤 습관을 기록하시겠습니까?\n\n${habitNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}\n\n번호를 입력하세요:`, '1');
        
        if (selectedHabit === null) return;

        const habitIndex = parseInt(selectedHabit) - 1;
        if (isNaN(habitIndex) || habitIndex < 0 || habitIndex >= this.habits.length) {
            alert('올바른 번호를 입력해주세요!');
            return;
        }

        const selectedHabitId = this.habits[habitIndex].id;
        const dayRecords = this.habitRecords[dateKey];

        if (dayRecords.includes(selectedHabitId)) {
            // 이미 기록된 습관이면 제거
            this.habitRecords[dateKey] = dayRecords.filter(id => id !== selectedHabitId);
            this.showMessage('습관 기록이 제거되었습니다.');
        } else {
            // 새로운 습관 기록 추가
            this.habitRecords[dateKey].push(selectedHabitId);
            this.showMessage('습관이 기록되었습니다! 🎉');
        }

        this.saveRecords();
        this.renderCalendar();
        this.renderTrendChart(); // 트렌드 차트도 업데이트
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    updateLegend() {
        const legendItems = document.getElementById('legendItems');
        legendItems.innerHTML = '';

        if (this.habits.length === 0) {
            legendItems.innerHTML = '<p style="color: #a0aec0; text-align: center;">습관을 추가하면 여기에 색상 범례가 표시됩니다.</p>';
            return;
        }

        this.habits.forEach(habit => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.innerHTML = `
                <div class="legend-color color-${habit.color}"></div>
                <span>${habit.name}</span>
            `;
            legendItems.appendChild(legendItem);
        });
    }

    renderTrendChart() {
        const chartContainer = document.getElementById('chartContainer');
        chartContainer.innerHTML = '';

        if (this.habits.length === 0) {
            chartContainer.innerHTML = '<div class="no-data">습관을 추가하면 여기에 트렌드 차트가 표시됩니다.</div>';
            return;
        }

        this.habits.forEach(habit => {
            const chartData = this.getHabitTrendData(habit.id);
            const chartElement = this.createHabitChart(habit, chartData);
            chartContainer.appendChild(chartElement);
        });
    }

    getHabitTrendData(habitId) {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 29); // 30일간

        const data = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date(thirtyDaysAgo);
            date.setDate(thirtyDaysAgo.getDate() + i);
            const dateKey = this.getDateKey(date);
            const dayRecords = this.habitRecords[dateKey] || [];
            const isCompleted = dayRecords.includes(habitId);
            const isToday = this.isSameDate(date, today);
            
            data.push({
                date: new Date(date),
                completed: isCompleted,
                isToday: isToday
            });
        }

        return data;
    }

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    createHabitChart(habit, data) {
        const completedCount = data.filter(d => d.completed).length;
        const completionRate = Math.round((completedCount / 30) * 100);

        const chartElement = document.createElement('div');
        chartElement.className = 'habit-chart';
        chartElement.style.borderLeftColor = this.getColorValue(habit.color);

        chartElement.innerHTML = `
            <div class="habit-chart-header">
                <div class="habit-chart-name">
                    <div class="habit-chart-color color-${habit.color}"></div>
                    <span>${habit.name}</span>
                </div>
                <div class="habit-chart-stats">
                    <span>완료: ${completedCount}/30일</span>
                    <span>완료율: ${completionRate}%</span>
                </div>
            </div>
            <div class="chart-bars" id="chart-${habit.id}">
                ${data.map((day, index) => this.createChartBar(day, habit.color, index)).join('')}
            </div>
            <div class="chart-labels">
                <span>30일 전</span>
                <span>오늘</span>
            </div>
        `;

        return chartElement;
    }

    createChartBar(day, color, index) {
        const height = day.completed ? '100%' : '20%';
        const classes = ['chart-bar'];
        
        if (day.completed) {
            classes.push('completed');
        } else {
            classes.push('missed');
        }
        
        if (day.isToday) {
            classes.push('today');
        }

        return `
            <div class="${classes.join(' ')}" 
                 style="background-color: ${this.getColorValue(color)}; height: ${height};"
                 title="${day.date.toLocaleDateString()}: ${day.completed ? '완료' : '미완료'}">
            </div>
        `;
    }

    getColorValue(colorName) {
        const colorMap = {
            'blue': '#3b82f6',
            'red': '#ef4444',
            'green': '#10b981',
            'purple': '#8b5cf6',
            'orange': '#f97316',
            'pink': '#ec4899',
            'yellow': '#eab308',
            'teal': '#14b8a6',
            'indigo': '#6366f1',
            'coral': '#ff6b6b',
            'emerald': '#059669',
            'rose': '#f43f5e',
            'sky': '#0ea5e9',
            'lime': '#84cc16',
            'violet': '#7c3aed',
            'amber': '#f59e0b',
            'cyan': '#06b6d4',
            'slate': '#64748b',
            'mint': '#6ee7b7'
        };
        return colorMap[colorName] || '#6b7280';
    }

    getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    showMessage(message) {
        // 간단한 토스트 메시지
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4a5568;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }

    // 로컬 스토리지 관련 메서드들
    saveHabits() {
        localStorage.setItem('habitTracker_habits', JSON.stringify(this.habits));
    }

    loadHabits() {
        const saved = localStorage.getItem('habitTracker_habits');
        return saved ? JSON.parse(saved) : [];
    }

    saveRecords() {
        localStorage.setItem('habitTracker_records', JSON.stringify(this.habitRecords));
    }

    loadRecords() {
        const saved = localStorage.getItem('habitTracker_records');
        return saved ? JSON.parse(saved) : {};
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// 앱 초기화
let habitTracker;
document.addEventListener('DOMContentLoaded', () => {
    habitTracker = new HabitTracker();
});
