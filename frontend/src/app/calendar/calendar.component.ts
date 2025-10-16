import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TodoApiService } from '../services/todo-api.service';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  date: Date;
  color: string;
  isRecurring: boolean;
  recurringDays?: number;
  originalDate?: Date;
  eventType: 'task' | 'birthday' | 'vacation' | 'timeoff' | 'family' | 'date' | 'social' | 'holiday';
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit {
  currentDate = new Date();
  currentMonth = this.currentDate.getMonth();
  currentYear = this.currentDate.getFullYear();
  isLoading: boolean = false;
  
  daysInMonth: Date[] = [];
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  tasks: Task[] = [];
  newTask: string = '';
  selectedDate: Date | null = null;
  isRecurring: boolean = false;
  recurringDays: number = 14;
  draggedTask: Task | null = null;
  editingTask: Task | null = null;
  editTaskText: string = '';
  selectedEventType: 'task' | 'birthday' | 'vacation' | 'timeoff' | 'family' | 'date' | 'social' | 'holiday' = 'task';

  constructor(
    private todoApiService: TodoApiService
  ) {}
  
  // Event types with colors and icons
  eventTypes = {
    task: { name: 'Task', color: '#FFE066', icon: 'task_alt' },
    birthday: { name: 'Birthday', color: '#FFB3BA', icon: 'cake' },
    vacation: { name: 'Vacation', color: '#BAFFC9', icon: 'flight' },
    timeoff: { name: 'Time Off', color: '#BAE1FF', icon: 'beach_access' },
    family: { name: 'Family Time', color: '#FFFFBA', icon: 'family_restroom' },
    date: { name: 'Date', color: '#FFDFBA', icon: 'favorite' },
    social: { name: 'Social', color: '#E6E6FA', icon: 'groups' },
    holiday: { name: 'Holiday', color: '#F0E68C', icon: 'celebration' }
  };

  // Post-it colors (fallback)
  colors = [
    '#FFE066', '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA',
    '#FFDFBA', '#E6E6FA', '#F0E68C', '#DDA0DD', '#98FB98'
  ];

  ngOnInit() {
    this.generateCalendar();
    this.loadTasks();
    this.generateMissingRecurringTasks();
  }

  generateCalendar() {
    this.daysInMonth = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      this.daysInMonth.push(date);
    }
  }

  getTasksForDate(date: Date): Task[] {
    return this.tasks.filter(task => 
      task.date.toDateString() === date.toDateString()
    );
  }

  addTask() {
    if (this.newTask.trim() && this.selectedDate) {
      const eventTypeConfig = this.eventTypes[this.selectedEventType];
      const task: Task = {
        id: Date.now().toString(),
        text: this.newTask.trim(),
        completed: false,
        date: new Date(this.selectedDate),
        color: eventTypeConfig.color,
        isRecurring: this.isRecurring,
        recurringDays: this.isRecurring ? this.recurringDays : undefined,
        originalDate: this.isRecurring ? new Date(this.selectedDate) : undefined,
        eventType: this.selectedEventType
      };
      // Add to local array immediately for UI responsiveness
      this.tasks.push(task);
      
      // If it's a recurring task, create all future occurrences for the next 3 months
      if (this.isRecurring) {
        this.createAllRecurringTasks(task);
      }

      // Save to API
      this.todoApiService.createTask(task).subscribe({
        next: (createdTask) => {
          // Update local array with the created task
          const index = this.tasks.findIndex(t => t.id === task.id);
          if (index !== -1) {
            this.tasks[index] = createdTask;
          }
          
          this.newTask = '';
          this.isRecurring = false;
          this.recurringDays = 14;
          this.selectedEventType = 'task';
          
          // Trigger notification check
          this.triggerNotificationCheck();
        },
        error: (error) => {
          console.error('Error creating task:', error);
        }
      });
      
      // Trigger notification check
      this.triggerNotificationCheck();
    }
  }

  toggleTask(task: Task) {
    task.completed = !task.completed;
    
    // If it's a recurring task and was just completed, create the next occurrence
    if (task.completed && task.isRecurring && task.recurringDays) {
      this.createNextRecurringTask(task);
    }
    
    this.todoApiService.updateTask(task).subscribe({
      next: () => {
        // Trigger notification check
        this.triggerNotificationCheck();
      },
      error: (error) => {
        console.error('Error updating task:', error);
        // Revert the change on error
        task.completed = !task.completed;
      }
    });
  }

  deleteTask(taskId: string) {
    const task = this.tasks.find(t => t.id === taskId);
    
    if (task && task.isRecurring) {
      // Show confirmation dialog for recurring tasks
      const confirmDelete = confirm(
        `This is a recurring task. Do you want to:\n\n` +
        `• Click OK to delete ALL future occurrences\n` +
        `• Click Cancel to delete only today's occurrence`
      );
      
      if (confirmDelete) {
        // Delete all future occurrences of this recurring task
        this.todoApiService.deleteRecurringTasks(task.text, task.originalDate!).subscribe({
          next: () => {
            this.tasks = this.tasks.filter(t => 
              !(t.isRecurring && t.text === task.text && t.originalDate && 
                t.originalDate.getTime() === task.originalDate!.getTime())
            );
          },
          error: (error) => {
            console.error('Error deleting recurring tasks:', error);
          }
        });
      } else {
        // Delete only this specific occurrence
        this.todoApiService.deleteTask(taskId).subscribe({
          next: () => {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
          },
          error: (error) => {
            console.error('Error deleting task:', error);
          }
        });
      }
    } else {
      // Regular task - delete normally
      this.todoApiService.deleteTask(taskId).subscribe({
        next: () => {
          this.tasks = this.tasks.filter(t => t.id !== taskId);
        },
        error: (error) => {
          console.error('Error deleting task:', error);
        }
      });
    }
  }

  editTask(task: Task) {
    
    this.editingTask = task;
    this.editTaskText = task.text;
  }

  saveEdit() {
    if (this.editingTask && this.editTaskText.trim()) {
      this.editingTask.text = this.editTaskText.trim();
      
      this.todoApiService.updateTask(this.editingTask).subscribe({
        next: () => {
          this.cancelEdit();
        },
        error: (error) => {
          console.error('Error updating task:', error);
          // Revert the change on error
          this.editingTask!.text = this.editTaskText;
        }
      });
    }
  }

  cancelEdit() {
    this.editingTask = null;
    this.editTaskText = '';
  }

  isEditing(task: Task): boolean {
    return this.editingTask?.id === task.id;
  }

  getEventTypeIcon(eventType: string): string {
    return this.eventTypes[eventType as keyof typeof this.eventTypes]?.icon || 'task_alt';
  }

  getEventTypeName(eventType: string): string {
    return this.eventTypes[eventType as keyof typeof this.eventTypes]?.name || 'Task';
  }

  getEventTypeColor(eventType: string): string {
    return this.eventTypes[eventType as keyof typeof this.eventTypes]?.color || '#FFE066';
  }

  get eventTypeKeys(): ('task' | 'birthday' | 'vacation' | 'timeoff' | 'family' | 'date' | 'social' | 'holiday')[] {
    return Object.keys(this.eventTypes) as ('task' | 'birthday' | 'vacation' | 'timeoff' | 'family' | 'date' | 'social' | 'holiday')[];
  }

  selectDate(date: Date) {
    this.selectedDate = new Date(date);
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth;
  }

  isSelectedDate(date: Date): boolean {
    return this.selectedDate ? date.toDateString() === this.selectedDate.toDateString() : false;
  }

  previousMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
  }

  goToToday() {
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
    this.generateCalendar();
  }

  onTaskDragStart(event: DragEvent, task: Task) {
    this.draggedTask = task;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', task.id);
    }
  }

  onTaskDragEnd(event: DragEvent) {
    this.draggedTask = null;
  }

  onDateDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDateDrop(event: DragEvent, targetDate: Date) {
    event.preventDefault();
    
    if (this.draggedTask) {
      this.draggedTask.date = new Date(targetDate);
      this.draggedTask = null;
    }
  }

  onDateDragEnter(event: DragEvent) {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    target.classList.add('drag-over');
  }

  onDateDragLeave(event: DragEvent) {
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over');
  }

  createAllRecurringTasks(originalTask: Task) {
    if (!originalTask.recurringDays || !originalTask.originalDate) return;
    
    const startDate = new Date(originalTask.originalDate);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Create tasks for next 3 months
    
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + originalTask.recurringDays); // Start from the next occurrence
    
    while (currentDate <= endDate) {
      // Check if we already have this recurring task for this date
      const existingTask = this.tasks.find(task => 
        task.text === originalTask.text && 
        task.date.toDateString() === currentDate.toDateString() &&
        task.isRecurring
      );
      
      if (!existingTask) {
        const recurringTask: Task = {
          id: Date.now().toString() + Math.random() + currentDate.getTime(),
          text: originalTask.text,
          completed: false,
          date: new Date(currentDate),
          color: originalTask.color,
          isRecurring: true,
          recurringDays: originalTask.recurringDays,
          originalDate: originalTask.originalDate,
          eventType: originalTask.eventType
        };
        
        this.todoApiService.createTask(recurringTask).subscribe({
          next: (createdTask) => {
            this.tasks.push(createdTask);
          },
          error: (error) => {
            console.error('Error creating recurring task:', error);
          }
        });
      }
      
      // Move to next occurrence
      currentDate.setDate(currentDate.getDate() + originalTask.recurringDays);
    }
  }

  createNextRecurringTask(originalTask: Task) {
    if (!originalTask.recurringDays || !originalTask.originalDate) return;
    
    const nextDate = new Date(originalTask.originalDate);
    nextDate.setDate(nextDate.getDate() + originalTask.recurringDays);
    
    // Check if we already have this recurring task for the next date
    const existingTask = this.tasks.find(task => 
      task.text === originalTask.text && 
      task.date.toDateString() === nextDate.toDateString() &&
      task.isRecurring
    );
    
    if (!existingTask) {
      const nextTask: Task = {
        id: Date.now().toString() + Math.random(),
        text: originalTask.text,
        completed: false,
        date: nextDate,
        color: originalTask.color,
        isRecurring: true,
        recurringDays: originalTask.recurringDays,
        originalDate: originalTask.originalDate,
        eventType: originalTask.eventType
      };
      
      this.todoApiService.createTask(nextTask).subscribe({
        next: (createdTask) => {
          this.tasks.push(createdTask);
        },
        error: (error) => {
          console.error('Error creating next recurring task:', error);
        }
      });
    }
  }

  getRecurringTasks(): Task[] {
    return this.tasks.filter(task => task.isRecurring);
  }

  getTaskDisplayText(task: Task): string {
    if (task.isRecurring && task.recurringDays) {
      return `${task.text} (every ${task.recurringDays} days)`;
    }
    return task.text;
  }

  generateMissingRecurringTasks() {
    const recurringTasks = this.tasks.filter(task => task.isRecurring && task.recurringDays);
    
    recurringTasks.forEach(task => {
      if (task.originalDate) {
        // Find the last occurrence of this recurring task
        const lastOccurrence = this.tasks
          .filter(t => t.text === task.text && t.isRecurring && t.originalDate?.getTime() === task.originalDate?.getTime())
          .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
        
        if (lastOccurrence) {
          const nextDate = new Date(lastOccurrence.date);
          nextDate.setDate(nextDate.getDate() + (task.recurringDays || 1));
          
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 3);
          
          while (nextDate <= endDate) {
            const existingTask = this.tasks.find(t => 
              t.text === task.text && 
              t.date.toDateString() === nextDate.toDateString() &&
              t.isRecurring
            );
            
            if (!existingTask) {
              const newTask: Task = {
                id: Date.now().toString() + Math.random() + nextDate.getTime(),
                text: task.text,
                completed: false,
                date: new Date(nextDate),
                color: task.color,
                isRecurring: true,
                recurringDays: task.recurringDays,
                originalDate: task.originalDate,
                eventType: task.eventType
              };
              this.tasks.push(newTask);
            }
            
            nextDate.setDate(nextDate.getDate() + (task.recurringDays || 1));
          }
        }
      }
    });
    
  }

  triggerNotificationCheck() {
    // Dispatch a custom event that the navbar can listen to
    window.dispatchEvent(new CustomEvent('taskUpdated'));
  }


  private loadTasks() {
    this.isLoading = true;
    this.todoApiService.getAllTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks.map(task => ({
          ...task,
          date: new Date(task.date),
          originalDate: task.originalDate ? new Date(task.originalDate) : undefined
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.isLoading = false;
      }
    });
  }
}
