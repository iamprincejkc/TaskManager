// Global variables
        let tasks = [];
        let editingTaskId = null;
        let taskToDelete = null;
        let currentTaskDetailsId = null;
        let theme = localStorage.getItem('jkc-theme') || 'dark';

        // Utility functions first
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function convertToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }

        // Ensure backward compatibility for existing tasks
        function ensureTaskStructure(task) {
            if (!task.subtasks) task.subtasks = [];
            if (!task.comments) task.comments = [];
            if (!task.createdAt) task.createdAt = new Date().toISOString();
            return task;
        }

        function getColumnColor(column) {
            const columnColors = {
                'todo': '#FF9500',
                'progress': '#007AFF',
                'done': '#34C759'
            };
            return columnColors[column] || '#007AFF';
        }

        // Theme management
        function initializeTheme() {
            document.documentElement.setAttribute('data-theme', theme);
            updateThemeIcon();
        }

        function toggleTheme() {
            theme = theme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('jkc-theme', theme);
            updateThemeIcon();
        }

        function updateThemeIcon() {
            const themeToggle = document.getElementById('themeToggle');
            themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        }

        // Initialize app
        document.addEventListener('DOMContentLoaded', function () {
            initializeTheme();
            loadTasks();
            setupEventListeners();
        });

        // Task management
        function loadTasks() {
            const savedTasks = localStorage.getItem('jkc-tasks');
            if (savedTasks) {
                try {
                    tasks = JSON.parse(savedTasks);
                } catch (e) {
                    console.error('Error parsing saved tasks:', e);
                    tasks = [];
                }
            } else {
                // Create welcome tasks
                tasks = [
                    {
                        id: 'welcome-1',
                        title: 'Welcome to JKC! 🎉',
                        description: 'Just Keep Creating - your new productivity companion! This beautiful task manager will help you turn ideas into reality.',
                        column: 'todo',
                        color: null,
                        deadline: '',
                        image: null,
                        createdAt: new Date().toISOString(),
                        subtasks: [
                            { id: 'sub1', text: 'Explore the beautiful interface', completed: true },
                            { id: 'sub2', text: 'Try creating your first task', completed: false },
                            { id: 'sub3', text: 'Add some subtasks and comments', completed: false }
                        ],
                        comments: [
                            {
                                id: 'comment1',
                                text: 'Welcome to JKC! This is how comments work - perfect for notes and collaboration.',
                                author: 'JKC Team',
                                createdAt: new Date().toISOString()
                            }
                        ]
                    },
                    {
                        id: 'welcome-2',
                        title: 'Start Creating Something Amazing',
                        description: 'Add colors, images, deadlines, and more to your tasks. Drag this card between columns to see the magic happen!',
                        column: 'progress',
                        color: null,
                        deadline: '',
                        image: null,
                        createdAt: new Date().toISOString(),
                        subtasks: [
                            { id: 'sub4', text: 'Learn about subtasks', completed: true },
                            { id: 'sub5', text: 'Try the drag and drop feature', completed: false }
                        ],
                        comments: []
                    }
                ];
                saveTasks();
            }
            renderAllTasks();
            updateStats();
        }

        function saveTasks() {
            try {
                localStorage.setItem('jkc-tasks', JSON.stringify(tasks));
            } catch (e) {
                console.error('Error saving tasks:', e);
            }
        }

        function renderAllTasks() {
            // Clear task lists
            document.querySelectorAll('.task-list').forEach(list => {
                const addButton = list.querySelector('.add-task');
                list.innerHTML = '';
                list.appendChild(addButton);
            });

            // Render tasks with backward compatibility
            tasks.forEach(task => {
                if (task && task.id && task.column) {
                    ensureTaskStructure(task);
                    renderTask(task);
                }
            });
            updateColumnCounts();
        }

        function renderTask(task) {
            if (!task || !task.id || !task.column) return;

            const column = document.getElementById(task.column);
            if (!column) return;

            const taskList = column.querySelector('.task-list');
            const addButton = taskList.querySelector('.add-task');

            const taskElement = document.createElement('div');
            taskElement.className = 'task';
            taskElement.dataset.taskId = task.id;

            // Use custom task color if set, otherwise use current column color
            const taskColor = task.color || getColumnColor(task.column);
            taskElement.style.setProperty('--task-color', taskColor);

            const imageHtml = task.image ?
                `<img src="${task.image}" alt="Task image" class="task-image">` : '';

            const dateHtml = task.deadline ?
                new Date(task.deadline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }) : 'No deadline';

            // Calculate subtask progress
            const subtasks = task.subtasks || [];
            const completedSubtasks = subtasks.filter(s => s.completed).length;
            const totalSubtasks = subtasks.length;
            const progressPercent = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

            const progressHtml = totalSubtasks > 0 ? `
                <div class="task-progress">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span>Subtasks: ${completedSubtasks}/${totalSubtasks}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
            ` : '';

            taskElement.innerHTML = `
                <div class="task-drag-handle" title="Drag to move">⋮⋮</div>
                <div class="task-header">
                    <div class="task-title">${escapeHtml(task.title || 'Untitled Task')}</div>
                    <div class="task-actions">
                        <button class="task-btn edit" title="Edit" data-task-id="${task.id}">✏️</button>
                        <button class="task-btn delete" title="Delete" data-task-id="${task.id}">🗑️</button>
                    </div>
                </div>
                <div class="task-description">${escapeHtml(task.description || '')}</div>
                ${imageHtml}
                ${progressHtml}
                <div class="task-footer">
                    <div class="task-date">📅 ${dateHtml}</div>
                </div>
            `;

            // Add event listeners
            const editBtn = taskElement.querySelector('.task-btn.edit');
            const deleteBtn = taskElement.querySelector('.task-btn.delete');

            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editTask(task.id);
                });
            }

            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                });
            }

            // Add click event to open task details
            taskElement.addEventListener('click', (e) => {
                // Prevent opening details when clicking on buttons or drag handle
                if (e.target.closest('.task-actions') ||
                    e.target.closest('.task-drag-handle') ||
                    e.target.tagName === 'BUTTON') {
                    return;
                }
                openTaskDetails(task.id);
            });

            // Make task draggable
            taskElement.draggable = true;
            taskElement.addEventListener('dragstart', handleDragStart);
            taskElement.addEventListener('dragend', handleDragEnd);

            taskList.insertBefore(taskElement, addButton);
        }

        function updateStats() {
            const total = tasks.length;
            const completed = tasks.filter(t => t.column === 'done').length;
            const inProgress = tasks.filter(t => t.column === 'progress').length;

            document.getElementById('totalTasks').textContent = total;
            document.getElementById('completedTasks').textContent = completed;
            document.getElementById('inProgressTasks').textContent = inProgress;
        }

        function updateColumnCounts() {
            ['todo', 'progress', 'done'].forEach(columnId => {
                const column = document.getElementById(columnId);
                const count = tasks.filter(t => t.column === columnId).length;
                column.querySelector('.column-count').textContent = count;
            });
        }

        // Subtasks functions
        function renderSubtasks(task) {
            const subtasks = task.subtasks || [];
            const subtasksList = document.getElementById('subtasksList');
            const completedCount = subtasks.filter(s => s.completed).length;

            document.getElementById('subtaskProgress').textContent = `${completedCount}/${subtasks.length} completed`;

            subtasksList.innerHTML = '';

            subtasks.forEach(subtask => {
                const subtaskElement = document.createElement('div');
                subtaskElement.className = 'subtask-item';
                subtaskElement.innerHTML = `
                    <div class="subtask-checkbox ${subtask.completed ? 'completed' : ''}" onclick="toggleSubtask('${subtask.id}')">
                        ${subtask.completed ? '✓' : ''}
                    </div>
                    <div class="subtask-text ${subtask.completed ? 'completed' : ''}">${escapeHtml(subtask.text)}</div>
                    <button class="delete-subtask" onclick="deleteSubtask('${subtask.id}')" title="Delete subtask">🗑️</button>
                `;
                subtasksList.appendChild(subtaskElement);
            });
        }

        function addSubtask() {
            const input = document.getElementById('newSubtaskInput');
            const text = input.value.trim();

            if (!text || !currentTaskDetailsId) return;

            const task = tasks.find(t => t.id === currentTaskDetailsId);
            if (!task) return;

            if (!task.subtasks) task.subtasks = [];

            const newSubtask = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                text: text,
                completed: false
            };

            task.subtasks.push(newSubtask);
            input.value = '';

            saveTasks();
            renderSubtasks(task);
            renderAllTasks(); // Update progress bars
        }

        function toggleSubtask(subtaskId) {
            if (!currentTaskDetailsId) return;

            const task = tasks.find(t => t.id === currentTaskDetailsId);
            if (!task || !task.subtasks) return;

            const subtask = task.subtasks.find(s => s.id === subtaskId);
            if (subtask) {
                subtask.completed = !subtask.completed;
                saveTasks();
                renderSubtasks(task);
                renderAllTasks(); // Update progress bars
            }
        }

        function deleteSubtask(subtaskId) {
            if (!currentTaskDetailsId) return;

            const task = tasks.find(t => t.id === currentTaskDetailsId);
            if (!task || !task.subtasks) return;

            task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
            saveTasks();
            renderSubtasks(task);
            renderAllTasks(); // Update progress bars
        }

        // Comments functions
        function renderComments(task) {
            const comments = task.comments || [];
            const commentsList = document.getElementById('commentsList');

            commentsList.innerHTML = '';

            if (comments.length === 0) {
                commentsList.innerHTML = '<div style="text-align: center; color: var(--text-tertiary); font-style: italic; padding: 20px;">No comments yet. Add the first one!</div>';
                return;
            }

            comments.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment-item';
                commentElement.innerHTML = `
                    <div class="comment-header">
                        <span class="comment-author">${escapeHtml(comment.author)}</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="comment-date">${new Date(comment.createdAt).toLocaleDateString()}</span>
                            <button class="delete-comment" onclick="deleteComment('${comment.id}')" title="Delete comment">🗑️</button>
                        </div>
                    </div>
                    <div class="comment-text">${escapeHtml(comment.text)}</div>
                `;
                commentsList.appendChild(commentElement);
            });
        }

        function addComment() {
            const input = document.getElementById('newCommentInput');
            const text = input.value.trim();

            if (!text || !currentTaskDetailsId) return;

            const task = tasks.find(t => t.id === currentTaskDetailsId);
            if (!task) return;

            if (!task.comments) task.comments = [];

            const newComment = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                text: text,
                author: 'You', // In a real app, this would be the current user
                createdAt: new Date().toISOString()
            };

            task.comments.push(newComment);
            input.value = '';

            saveTasks();
            renderComments(task);
        }

        function deleteComment(commentId) {
            if (!currentTaskDetailsId) return;

            const task = tasks.find(t => t.id === currentTaskDetailsId);
            if (!task || !task.comments) return;

            task.comments = task.comments.filter(c => c.id !== commentId);
            saveTasks();
            renderComments(task);
        }

        // Task Details Modal functions
        function openTaskDetails(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            // Ensure task has required structure
            ensureTaskStructure(task);
            currentTaskDetailsId = taskId;

            // Update task details
            document.getElementById('detailsTaskTitle').textContent = task.title;
            document.getElementById('detailsTaskDescription').textContent = task.description || 'No description';

            // Update meta information
            const columnNames = { 'todo': '📝 To Do', 'progress': '🔄 In Progress', 'done': '✅ Done' };
            document.getElementById('detailsTaskColumn').textContent = columnNames[task.column];

            const deadlineText = task.deadline ?
                `📅 ${new Date(task.deadline).toLocaleDateString()}` : '📅 No deadline';
            document.getElementById('detailsTaskDeadline').textContent = deadlineText;

            const createdText = `⏰ Created ${new Date(task.createdAt).toLocaleDateString()}`;
            document.getElementById('detailsTaskCreated').textContent = createdText;

            // Update image
            const imageContainer = document.getElementById('detailsTaskImage');
            if (task.image) {
                imageContainer.innerHTML = `<img src="${task.image}" alt="Task image" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px; border: 1px solid var(--glass-border);">`;
            } else {
                imageContainer.innerHTML = '';
            }

            renderSubtasks(task);
            renderComments(task);

            document.getElementById('taskDetailsModal').classList.add('show');
        }

        function closeTaskDetailsModal() {
            document.getElementById('taskDetailsModal').classList.remove('show');
            currentTaskDetailsId = null;
        }

        function editTaskFromDetails() {
            if (currentTaskDetailsId) {
                closeTaskDetailsModal();
                editTask(currentTaskDetailsId);
            }
        }

        function deleteTaskFromDetails() {
            if (currentTaskDetailsId) {
                closeTaskDetailsModal();
                deleteTask(currentTaskDetailsId);
            }
        }

        // Modal functions
        function openTaskModal(column) {
            editingTaskId = null;
            document.getElementById('taskId').value = '';
            document.getElementById('taskColumn').value = column;
            document.getElementById('modalTitle').textContent = 'Create New Task';
            document.getElementById('taskForm').reset();
            document.getElementById('taskColor').value = '#007AFF';
            document.getElementById('defaultColor').checked = true;
            document.getElementById('customColor').checked = false;
            document.getElementById('colorPickerSection').style.display = 'none';
            document.getElementById('submitBtn').textContent = 'Create Task';
            document.getElementById('taskModal').classList.add('show');
            setTimeout(() => {
                const titleInput = document.getElementById('taskTitle');
                if (titleInput) titleInput.focus();
            }, 100);
        }

        function closeTaskModal() {
            document.getElementById('taskModal').classList.remove('show');
        }

        function editTask(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            editingTaskId = taskId;
            document.getElementById('taskId').value = taskId;
            document.getElementById('taskColumn').value = task.column;
            document.getElementById('taskTitle').value = task.title || '';
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskDeadline').value = task.deadline || '';

            // Set color options based on whether task has custom color
            if (task.color) {
                document.getElementById('customColor').checked = true;
                document.getElementById('defaultColor').checked = false;
                document.getElementById('taskColor').value = task.color;
                document.getElementById('colorPickerSection').style.display = 'block';
            } else {
                document.getElementById('defaultColor').checked = true;
                document.getElementById('customColor').checked = false;
                document.getElementById('colorPickerSection').style.display = 'none';
            }

            document.getElementById('modalTitle').textContent = 'Edit Task';
            document.getElementById('submitBtn').textContent = 'Update Task';
            document.getElementById('taskModal').classList.add('show');
        }

        function deleteTask(taskId) {
            taskToDelete = taskId;
            document.getElementById('deleteModal').classList.add('show');
        }

        function confirmDelete() {
            if (taskToDelete) {
                tasks = tasks.filter(t => t.id !== taskToDelete);
                saveTasks();
                renderAllTasks();
                updateStats();
                closeDeleteModal();
                showSuccess('Task deleted!', 'Task has been removed successfully');
                taskToDelete = null;
            }
        }

        function closeDeleteModal() {
            document.getElementById('deleteModal').classList.remove('show');
        }

        function closeHelpModal() {
            document.getElementById('helpModal').classList.remove('show');
        }

        function showSuccess(title, description) {
            document.getElementById('successMessage').textContent = title;
            document.getElementById('successDescription').textContent = description;
            document.getElementById('successModal').classList.add('show');

            setTimeout(() => {
                document.getElementById('successModal').classList.remove('show');
            }, 2000);
        }

        // Drag and drop
        function handleDragStart(e) {
            this.classList.add('dragging');
            e.dataTransfer.setData('text/plain', this.dataset.taskId);
        }

        function handleDragEnd() {
            this.classList.remove('dragging');
        }

        // Event listeners
        function setupEventListeners() {
            // Theme toggle
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', toggleTheme);
            }

            // Help modal
            const helpToggle = document.getElementById('helpToggle');
            if (helpToggle) {
                helpToggle.addEventListener('click', () => {
                    document.getElementById('helpModal').classList.add('show');
                });
            }

            // Form submission
            const taskForm = document.getElementById('taskForm');
            if (taskForm) {
                taskForm.addEventListener('submit', async function (e) {
                    e.preventDefault();

                    const useCustomColor = document.getElementById('customColor').checked;

                    const taskData = {
                        title: document.getElementById('taskTitle').value,
                        description: document.getElementById('taskDescription').value,
                        deadline: document.getElementById('taskDeadline').value,
                        color: useCustomColor ? document.getElementById('taskColor').value : null,
                        column: document.getElementById('taskColumn').value
                    };

                    // Handle image
                    const imageFile = document.getElementById('taskImage').files[0];
                    if (imageFile) {
                        try {
                            taskData.image = await convertToBase64(imageFile);
                        } catch (e) {
                            console.error('Error converting image:', e);
                        }
                    }

                    if (editingTaskId) {
                        // Update task
                        const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
                        if (taskIndex !== -1) {
                            tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
                            showSuccess('Task updated!', 'Your changes have been saved');
                        }
                    } else {
                        // Create task
                        const newTask = {
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                            ...taskData,
                            subtasks: [],
                            comments: [],
                            createdAt: new Date().toISOString()
                        };
                        tasks.push(newTask);
                        showSuccess('Task created!', 'Your new task has been added');
                    }

                    saveTasks();
                    renderAllTasks();
                    updateStats();
                    closeTaskModal();
                });

                // Add event listeners for color option radio buttons
                document.getElementById('defaultColor').addEventListener('change', function () {
                    if (this.checked) {
                        document.getElementById('colorPickerSection').style.display = 'none';
                    }
                });

                document.getElementById('customColor').addEventListener('change', function () {
                    if (this.checked) {
                        document.getElementById('colorPickerSection').style.display = 'block';
                    }
                });
            }

            // Drag and drop
            ['todo', 'progress', 'done'].forEach(columnId => {
                const column = document.getElementById(columnId);
                if (!column) return;

                column.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    column.classList.add('drag-over');
                });

                column.addEventListener('dragleave', (e) => {
                    if (!column.contains(e.relatedTarget)) {
                        column.classList.remove('drag-over');
                    }
                });

                column.addEventListener('drop', (e) => {
                    e.preventDefault();
                    column.classList.remove('drag-over');

                    const taskId = e.dataTransfer.getData('text/plain');
                    const task = tasks.find(t => t.id === taskId);

                    if (task && task.column !== columnId) {
                        task.column = columnId;
                        saveTasks();
                        renderAllTasks();
                        updateStats();
                    }
                });
            });

            // Close modals on backdrop click
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) {
                    e.target.classList.remove('show');
                }
            });

            // Add keyboard support for subtask and comment inputs
            document.getElementById('newSubtaskInput').addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    addSubtask();
                }
            });

            document.getElementById('newCommentInput').addEventListener('keypress', function (e) {
                if (e.key === 'Enter' && e.ctrlKey) {
                    addComment();
                }
            });
        }

        // Make all functions globally accessible
        window.openTaskModal = openTaskModal;
        window.closeTaskModal = closeTaskModal;
        window.editTask = editTask;
        window.deleteTask = deleteTask;
        window.confirmDelete = confirmDelete;
        window.closeDeleteModal = closeDeleteModal;
        window.closeHelpModal = closeHelpModal;
        window.openTaskDetails = openTaskDetails;
        window.closeTaskDetailsModal = closeTaskDetailsModal;
        window.editTaskFromDetails = editTaskFromDetails;
        window.deleteTaskFromDetails = deleteTaskFromDetails;
        window.addSubtask = addSubtask;
        window.toggleSubtask = toggleSubtask;
        window.deleteSubtask = deleteSubtask;
        window.addComment = addComment;
        window.deleteComment = deleteComment;