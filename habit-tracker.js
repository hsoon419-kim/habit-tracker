class HabitTracker {
    constructor() {
        this.habits = this.loadHabits();
        this.currentDate = new Date();
        this.habitRecords = this.loadRecords();
        this.selectedDate = null;
        this.motto = document.getElementById('lifeMotto');
        
        this.init();
    }

    init() {
        this.loadMotto();
        this.setupEventListeners();
        this.renderCalendar();
        this.updateLegend();
        this.renderTrendChart();
    }

    setupEventListeners() {
        this.motto.addEventListener('blur', () => this.saveMotto());
        this.motto.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.motto.blur();
            }
        });

        document.getElementById('addHabitBtn').addEventListener('click', () => this.addHabit());
        document.getElementById('habitName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addHabit();
        });

        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));

        document.getElementById('addMemoBtn').addEventListener('click', () => this.addMemo());
        document.getElementById('memoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addMemo();
        });

        const exportBtn = document.getElementById('exportJsonBtn');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportDataAsJson());
        
        const importFileInput = document.getElementById('importJsonFile');
        if (importFileInput) importFileInput.addEventListener('change', (e) => this.importFromFile(e));
        
        const importTextBtn = document.getElementById('importJsonTextBtn');
        if (importTextBtn) importTextBtn.addEventListener('click', () => this.importFromTextarea());
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

        const newHabit = { id: Date.now().toString(), name, color };
        this.habits.push(newHabit);
        this.saveHabits();
        this.updateLegend();
        this.renderTrendChart();
        if (this.selectedDate) this.renderDailyDetails();
        
        nameInput.value = '';
        colorSelect.value = 'blue';
        this.showMessage('새 습관이 추가되었습니다! 🎉');
    }

    deleteHabit(habitId) {
        if (!confirm('정말로 이 습관을 삭제하시겠습니까? 관련된 모든 기록이 사라집니다.')) return;

        this.habits = this.habits.filter(habit => habit.id !== habitId);
        Object.keys(this.habitRecords).forEach(dateKey => {
            const record = this.getRecord(dateKey);
            record.completed = record.completed.filter(id => id !== habitId);
        });

        this.saveHabits();
        this.saveRecords();
        this.updateLegend();
        this.renderCalendar();
        this.renderTrendChart();
        if (this.selectedDate) this.renderDailyDetails();

        this.showMessage('습관이 삭제되었습니다.');
    }

    updateLegend() {
        const legendItems = document.getElementById('legendItems');
        legendItems.innerHTML = '';

        if (this.habits.length === 0) {
            legendItems.innerHTML = '<p style="color: #a0aec0; text-align: center; padding: 15px 0;">습관을 추가하면 여기에 표시됩니다.</p>';
            return;
        }

        this.habits.forEach(habit => {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.style.borderLeftColor = this.getColorValue(habit.color);
            item.innerHTML = `
                <div class="legend-info">
                    <div class="legend-color color-${habit.color}"></div>
                    <span class="legend-name">${habit.name}</span>
                </div>
                <button class="delete-habit" title="습관 삭제">×</button>
            `;
            item.querySelector('.delete-habit').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteHabit(habit.id);
            });
            legendItems.appendChild(item);
        });
    }

    renderCalendar() {
        const calendar = document.getElementById('calendar');
        const currentMonthEl = document.getElementById('currentMonth');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        currentMonthEl.textContent = `${year}년 ${month + 1}월`;
        calendar.innerHTML = '';

        const dayHeaders = ['일', '월', '화', '수', '목', '금', '토'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day;
            calendar.appendChild(dayHeader);
        });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const today = new Date();

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dayElement = document.createElement('div');
            dayElement.className = 'day';

            if (date.getMonth() !== month) dayElement.classList.add('other-month');
            if (date.getDay() === 0 || date.getDay() === 6) dayElement.classList.add('weekend');
            if (this.isSameDate(date, today)) dayElement.classList.add('today');
            if (this.selectedDate && this.isSameDate(date, this.selectedDate)) {
                dayElement.classList.add('selected');
            }

            dayElement.innerHTML = `<div class="day-number">${date.getDate()}</div><div class="stickers"></div>`;
            this.renderDayStickers(dayElement, date);
            dayElement.addEventListener('click', () => this.showDetailsForDate(date, dayElement));
            calendar.appendChild(dayElement);
        }
    }

    renderDayStickers(dayElement, date) {
        const stickersContainer = dayElement.querySelector('.stickers');
        const dateKey = this.getDateKey(date);
        const record = this.getRecord(dateKey);
        stickersContainer.innerHTML = '';

        record.completed.forEach(habitId => {
            const habit = this.habits.find(h => h.id === habitId);
            if (habit) {
                const sticker = document.createElement('div');
                sticker.className = `sticker color-${habit.color}`;
                sticker.title = habit.name;
                stickersContainer.appendChild(sticker);
            }
        });
    }

    showDetailsForDate(date, dayElement) {
        this.selectedDate = date;

        document.querySelectorAll('.day.selected').forEach(el => el.classList.remove('selected'));
        if (dayElement) dayElement.classList.add('selected');

        const titleEl = document.getElementById('dailyDetailsTitle');
        const contentEl = document.getElementById('dailyDetailsContent');
        titleEl.style.display = 'none';
        contentEl.classList.remove('hidden');

        document.getElementById('selectedDateStr').textContent = `${date.getMonth() + 1}월 ${date.getDate()}일`;
        this.renderDailyDetails();
    }

        renderDailyDetails() {
        if (!this.selectedDate) return;

        const dateKey = this.getDateKey(this.selectedDate);
        const record = this.getRecord(dateKey);
        const dailyHabitsList = document.getElementById('dailyHabitsList');
        const memoList = document.getElementById('memoList');
        dailyHabitsList.innerHTML = '';
        memoList.innerHTML = '';

        if (this.habits.length === 0) {
            dailyHabitsList.innerHTML = '<p class="no-data">관리 탭에서 먼저 습관을 추가해주세요.</p>';
        } else {
            this.habits.forEach(habit => {
                const item = document.createElement('div');
                item.className = 'daily-habit-item';
                const isChecked = record.completed.includes(habit.id);
                item.innerHTML = `
                    <label for="habit-check-${habit.id}">
                        <input type="checkbox" id="habit-check-${habit.id}" ${isChecked ? 'checked' : ''}>
                        <span class="legend-color color-${habit.color}"></span>
                        ${habit.name}
                    </label>
                `;
                item.querySelector('input').addEventListener('change', (e) => {
                    this.updateHabitStatus(habit.id, e.target.checked);
                });
                dailyHabitsList.appendChild(item);
            });
        }

        if (record.memos.length > 0) {
            record.memos.forEach((memo, index) => {
                const item = document.createElement('div');
                item.className = 'memo-item';
                if (memo.done) item.classList.add('done');
                
                item.innerHTML = `
                    <label for="memo-check-${index}">
                        <input type="checkbox" id="memo-check-${index}" ${memo.done ? 'checked' : ''}>
                        <span>${memo.text}</span>
                    </label>
                    <button class="delete-memo">×</button>
                `;
                item.querySelector('input').addEventListener('change', (e) => {
                    this.updateMemoStatus(index, e.target.checked);
                });
                item.querySelector('.delete-memo').addEventListener('click', () => this.deleteMemo(index));
                memoList.appendChild(item);
            });
        } else {
            memoList.innerHTML = '<p class="no-data">이 날짜에 추가된 메모가 없습니다.</p>';
        }
    }

    updateHabitStatus(habitId, isChecked) {
        const dateKey = this.getDateKey(this.selectedDate);
        const record = this.getRecord(dateKey);
        const habitExists = record.completed.includes(habitId);

        if (isChecked && !habitExists) {
            record.completed.push(habitId);
        } else if (!isChecked && habitExists) {
            record.completed = record.completed.filter(id => id !== habitId);
        }

        this.saveRecords();
        this.renderCalendar();
        this.renderTrendChart();
    }

        addMemo() {
        if (!this.selectedDate) {
            alert('메모를 추가할 날짜를 먼저 선택해주세요.');
            return;
        }
        const memoInput = document.getElementById('memoInput');
        const memoText = memoInput.value.trim();
        if (!memoText) return;

        const dateKey = this.getDateKey(this.selectedDate);
        const record = this.getRecord(dateKey);
        record.memos.push({ text: memoText, done: false }); // Changed
        this.saveRecords();
        this.renderDailyDetails();
        memoInput.value = '';
    }

    deleteMemo(index) {
        const dateKey = this.getDateKey(this.selectedDate);
        const record = this.getRecord(dateKey);
        record.memos.splice(index, 1);
        this.saveRecords();
        this.renderDailyDetails();
    }

    updateMemoStatus(index, isChecked) { // New function
        const dateKey = this.getDateKey(this.selectedDate);
        const record = this.getRecord(dateKey);
        if (record.memos[index]) {
            record.memos[index].done = isChecked;
            this.saveRecords();
            this.renderDailyDetails();
        }
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    // --- 데이터 관리 및 유틸리티 함수들 ---

    buildExportPayload() {
        return { version: 3, exportedAt: new Date().toISOString(), habits: this.habits, records: this.habitRecords, motto: this.motto.textContent.trim() };
    }

    exportDataAsJson() {
        const payload = this.buildExportPayload();
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        link.href = url;
        link.download = `habit-tracker-backup-${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.showMessage('데이터를 JSON 파일로 내보냈습니다.');
    }

    importFromFile(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                this.applyImportedData(JSON.parse(reader.result));
            } catch (err) {
                alert('유효한 JSON 파일이 아닙니다.');
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file, 'utf-8');
    }

    importFromTextarea() {
        const textarea = document.getElementById('importJsonText');
        if (!textarea) return;
        const value = textarea.value.trim();
        if (!value) {
            alert('가져올 JSON 텍스트를 입력해주세요.');
            return;
        }
        try {
            this.applyImportedData(JSON.parse(value));
            textarea.value = '';
        } catch (err) {
            alert('유효한 JSON 텍스트가 아닙니다.');
        }
    }

    applyImportedData(payload) {
        if (!payload || typeof payload !== 'object' || !Array.isArray(payload.habits) || typeof payload.records !== 'object') {
            alert('가져올 데이터 형식이 올바르지 않습니다.');
            return;
        }

        const backupKey = `habitTracker_backup_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(this.buildExportPayload()));

        this.habits = payload.habits;
        this.habitRecords = this.migrateRecords(payload.records); // 마이그레이션 적용
        this.motto.textContent = payload.motto || '';
        this.saveHabits();
        this.saveRecords();
        this.saveMotto();

        this.selectedDate = null;
        document.getElementById('dailyDetailsTitle').style.display = 'block';
        document.getElementById('dailyDetailsContent').classList.add('hidden');

        this.updateLegend();
        this.renderCalendar();
        this.renderTrendChart();
        this.showMessage('데이터를 가져왔습니다. (이전 데이터는 로컬 백업됨)');
    }

    migrateRecords(records) {
        // version 1 -> 2 (add .completed and .memos)
        // version 2 -> 3 (memos string[] to object[])
        Object.keys(records).forEach(dateKey => {
            const record = records[dateKey];
            if (Array.isArray(record)) { // v1 data: ["habitId1", ...]
                records[dateKey] = {
                    completed: record,
                    memos: []
                };
            } else if (record && record.memos && record.memos.length > 0 && typeof record.memos[0] === 'string') { // v2 data
                record.memos = record.memos.map(memoText => ({ text: memoText, done: false }));
            }
        });
        return records;
    }

    getRecord(dateKey) {
        if (!this.habitRecords[dateKey]) {
            this.habitRecords[dateKey] = { completed: [], memos: [] };
        }
        return this.habitRecords[dateKey];
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
        const data = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - (29 - i));
            const record = this.getRecord(this.getDateKey(date));
            data.push({
                date: date,
                completed: record.completed.includes(habitId),
                isToday: this.isSameDate(date, today)
            });
        }
        return data;
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
            <div class="chart-bars">${data.map(day => this.createChartBar(day, habit.color)).join('')}</div>
            <div class="chart-labels"><span>30일 전</span><span>오늘</span></div>
        `;
        return chartElement;
    }

    createChartBar(day, color) {
        const height = day.completed ? '100%' : '20%';
        const classes = ['chart-bar', day.completed ? 'completed' : 'missed'];
        if (day.isToday) classes.push('today');
        return `<div class="${classes.join(' ')}" style="background-color: ${this.getColorValue(color)}; height: ${height};" title="${day.date.toLocaleDateString()}: ${day.completed ? '완료' : '미완료'}"></div>`;
    }

    getColorValue(colorName) {
        const colorMap = { 'blue': '#3b82f6', 'red': '#ef4444', 'green': '#10b981', 'purple': '#8b5cf6', 'orange': '#f97316', 'pink': '#ec4899', 'yellow': '#eab308', 'teal': '#14b8a6', 'indigo': '#6366f1', 'coral': '#ff6b6b', 'emerald': '#059669', 'rose': '#f43f5e', 'sky': '#0ea5e9', 'lime': '#84cc16', 'violet': '#7c3aed', 'amber': '#f59e0b', 'cyan': '#06b6d4', 'slate': '#64748b', 'mint': '#6ee7b7' };
        return colorMap[colorName] || '#6b7280';
    }

    getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    isSameDate(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    }

    showMessage(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `position: fixed; top: 20px; right: 20px; background: #4a5568; color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 1000; animation: slideIn 0.3s ease-out;`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => { document.body.removeChild(toast); }, 300);
        }, 2000);
    }

    loadMotto() {
        const savedMotto = localStorage.getItem('habitTracker_motto');
        if (savedMotto) {
            this.motto.textContent = savedMotto;
        }
    }

    saveMotto() {
        const newMotto = this.motto.textContent.trim();
        localStorage.setItem('habitTracker_motto', newMotto);
    }

    saveHabits() { localStorage.setItem('habitTracker_habits', JSON.stringify(this.habits)); }
    loadHabits() { return JSON.parse(localStorage.getItem('habitTracker_habits') || '[]'); }
    saveRecords() { localStorage.setItem('habitTracker_records', JSON.stringify(this.habitRecords)); }
    loadRecords() {
        const saved = localStorage.getItem('habitTracker_records');
        const records = JSON.parse(saved || '{}');
        return this.migrateRecords(records); // 항상 마이그레이션 함수를 거치도록
    }
}

const style = document.createElement('style');
style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
document.head.appendChild(style);

let habitTracker;
document.addEventListener('DOMContentLoaded', () => { habitTracker = new HabitTracker(); });