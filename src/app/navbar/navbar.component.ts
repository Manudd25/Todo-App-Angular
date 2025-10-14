import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export interface Notification {
  id: string;
  task: string;
  date: Date;
  isRead: boolean;
  type: 'due_today' | 'overdue' | 'upcoming';
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  showNotifications = false;
  notifications: Notification[] = [];
  unreadCount = 0;

  ngOnInit() {
    this.loadNotifications();
    this.clearOldNotifications();
    this.checkForDueTasks();
    
    // Listen for task updates from the calendar
    window.addEventListener('taskUpdated', () => {
      this.checkForDueTasks();
    });
    
    // Close notifications when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-container')) {
        this.showNotifications = false;
      }
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.markAllAsRead();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(notification => notification.isRead = true);
    this.unreadCount = 0;
    this.saveNotifications();
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.unreadCount--;
      this.saveNotifications();
    }
  }

  removeNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    this.saveNotifications();
  }

  clearOldNotifications() {
    const today = new Date();
    const todayString = today.toDateString();
    
    // Remove notifications older than today
    this.notifications = this.notifications.filter(n => 
      n.date.toDateString() === todayString || n.type === 'overdue'
    );
    
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    this.saveNotifications();
  }

  checkForDueTasks() {
    const today = new Date();
    const todayString = today.toDateString();
    
    // Get tasks from localStorage
    const savedTasks = localStorage.getItem('calendar-tasks');
    if (savedTasks) {
      const tasks = JSON.parse(savedTasks).map((task: any) => ({
        ...task,
        date: new Date(task.date)
      }));
      
      const dueToday = tasks.filter((task: any) => 
        task.date.toDateString() === todayString && !task.completed
      );
      
      const overdue = tasks.filter((task: any) => {
        const taskDate = new Date(task.date);
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        
        // Only consider tasks as overdue if they were actually due before today
        // and are not future recurring tasks
        return taskDate < todayStart && !task.completed && 
               (!task.isRecurring || task.originalDate);
      });
      
      // Group tasks by text to handle recurring tasks
      const uniqueDueToday = this.getUniqueTasks(dueToday);
      const uniqueOverdue = this.getUniqueTasks(overdue);
      
      // Create notifications for due today tasks
      uniqueDueToday.forEach((task: any) => {
        const existingNotification = this.notifications.find(n => 
          n.task === task.text && n.date.toDateString() === todayString && n.type === 'due_today'
        );
        
        if (!existingNotification) {
          const notification: Notification = {
            id: `due-${task.text}-${todayString}`,
            task: task.text,
            date: task.date,
            isRead: false,
            type: 'due_today'
          };
          this.notifications.unshift(notification);
        }
      });
      
      // Create notifications for overdue tasks
      uniqueOverdue.forEach((task: any) => {
        const existingNotification = this.notifications.find(n => 
          n.task === task.text && n.type === 'overdue'
        );
        
        if (!existingNotification) {
          const notification: Notification = {
            id: `overdue-${task.text}`,
            task: task.text,
            date: task.date,
            isRead: false,
            type: 'overdue'
          };
          this.notifications.unshift(notification);
        }
      });
      
      this.unreadCount = this.notifications.filter(n => !n.isRead).length;
      this.saveNotifications();
    }
  }

  getUniqueTasks(tasks: any[]): any[] {
    const uniqueTasks = new Map();
    
    tasks.forEach(task => {
      // Use task text as key to group recurring tasks
      if (!uniqueTasks.has(task.text)) {
        uniqueTasks.set(task.text, task);
      }
    });
    
    return Array.from(uniqueTasks.values());
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'due_today': return 'schedule';
      case 'overdue': return 'warning';
      case 'upcoming': return 'event';
      default: return 'task_alt';
    }
  }

  getNotificationText(type: string): string {
    switch (type) {
      case 'due_today': return 'Due today';
      case 'overdue': return 'Overdue';
      case 'upcoming': return 'Upcoming';
      default: return 'Notification';
    }
  }

  getNotificationClass(type: string): string {
    switch (type) {
      case 'due_today': return 'notification-due-today';
      case 'overdue': return 'notification-overdue';
      case 'upcoming': return 'notification-upcoming';
      default: return 'notification-default';
    }
  }

  private saveNotifications() {
    localStorage.setItem('navbar-notifications', JSON.stringify(this.notifications));
  }

  private loadNotifications() {
    const saved = localStorage.getItem('navbar-notifications');
    if (saved) {
      this.notifications = JSON.parse(saved).map((n: any) => ({
        ...n,
        date: new Date(n.date)
      }));
      this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    }
  }
}
