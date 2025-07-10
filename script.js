let students = [];
const STORAGE_KEY = 'examLeaderboardData';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('studentForm');
    const tbody = document.getElementById('leaderboardBody');
    const clearBtn = document.querySelector('.btn-clear-all');
    const fileInput = document.getElementById('fileInput');
    const studentCount = document.getElementById('studentCount');
    const avgPercentage = document.getElementById('avgPercentage');
    const topScore = document.getElementById('topScore');

    form.addEventListener('submit', e => {
        e.preventDefault();
        const data = new FormData(form);
        const name = data.get('studentName').trim();


        if (!name || name.length < 2) return alert('Invalid name');
        if (isDuplicateName(name)) return alert('Name exists');

        const marks = ['math', 'english', 'science', 'social', 'computer'].reduce((obj, subject) => {
            const mark = parseInt(data.get(subject));
            if (isNaN(mark) || mark < 0 || mark > 100) return null;
            obj[subject] = mark;
            return obj;
        }, {});
        if (!marks || Object.keys(marks).length < 5) return alert('Invalid marks');

        const total = Object.values(marks).reduce((a, b) => a + b, 0);
        const percentage = Math.round((total / 500) * 100);

        students.push({ id: Date.now(), name, marks, total, percentage });
        saveData();
        render();
        form.reset();
    });

    if (clearBtn) clearBtn.addEventListener('click', () => {
        if (confirm('Clear all student data?')) {
            students = [];
            saveData();
            render();
        }
    });

    if (fileInput) fileInput.addEventListener('change', handleFileImport);

    loadData();

    function render() {
        tbody.innerHTML = '';
        if (students.length === 0) {
            if (studentCount) studentCount.textContent = '0 Students';
            if (avgPercentage) avgPercentage.textContent = '0%';
            if (topScore) topScore.textContent = '0%';
            return;
        }

        insertionSort(students);

        students.forEach((s, i) => {
            const row = tbody.insertRow();
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.addEventListener('click', () => del(s.id));
            row.innerHTML = `
                <td>${i + 1}</td>
                <td>${s.name}</td>
                <td>${s.marks.math}</td>
                <td>${s.marks.english}</td>
                <td>${s.marks.science}</td>
                <td>${s.marks.social}</td>
                <td>${s.marks.computer}</td>
                <td>${s.total}</td>
                <td>${s.percentage}%</td>
            `;
            const actionCell = document.createElement('td');
            actionCell.appendChild(delBtn);
            row.appendChild(actionCell);
        });

        if (studentCount) studentCount.textContent = `${students.length} Student${students.length !== 1 ? 's' : ''}`;
        const avg = Math.round(students.reduce((sum, s) => sum + s.percentage, 0) / students.length);
        const top = Math.max(...students.map(s => s.percentage));
        if (avgPercentage) avgPercentage.textContent = `${avg}%`;
        if (topScore) topScore.textContent = `${top}%`;
    }

    function del(id) {
        students = students.filter(s => s.id !== id);
        saveData();
        render();
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    }

    function loadData() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) students = JSON.parse(data);
        render();
    }

    function handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const headers = rows[0].map(h => h.toString().toLowerCase());
            const requiredHeaders = ['name', 'math', 'english', 'science', 'social', 'computer'];
            if (!requiredHeaders.every(h => headers.includes(h))) {
                alert('Missing required columns in Excel file.');
                return;
            }

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const student = {
                    name: row[headers.indexOf('name')].toString().trim(),
                    marks: {
                        math: parseInt(row[headers.indexOf('math')]),
                        english: parseInt(row[headers.indexOf('english')]),
                        science: parseInt(row[headers.indexOf('science')]),
                        social: parseInt(row[headers.indexOf('social')]),
                        computer: parseInt(row[headers.indexOf('computer')])
                    }
                };

                if (!student.name || student.name.length < 2 || isDuplicateName(student.name)) continue;
                const invalid = Object.values(student.marks).some(m => isNaN(m) || m < 0 || m > 100);
                if (invalid) continue;

                student.total = Object.values(student.marks).reduce((a, b) => a + b);
                student.percentage = Math.round((student.total / 500) * 100);
                student.id = Date.now() + Math.random();
                students.push(student);
            }

            saveData();
            render();
            event.target.value = '';
        };
        reader.readAsArrayBuffer(file);
    }

   
    function insertionSort(arr) {
        for (let i = 1; i < arr.length; i++) {
            let key = arr[i];
            let j = i - 1;
            while (j >= 0 && arr[j].percentage < key.percentage) {
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = key;
        }
    }

 
    function isDuplicateName(name) {
        for (let i = 0; i < students.length; i++) {
            if (students[i].name.toLowerCase() === name.toLowerCase()) {
                return true;
            }
        }
        return false;
    }
});
