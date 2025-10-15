import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../calendar/calendar.component';

@Injectable({
  providedIn: 'root'
})
export class TodoApiService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) { }

  // Get all tasks
  getAllTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`);
  }

  // Get tasks for a specific date
  getTasksForDate(date: Date): Observable<Task[]> {
    const dateString = date.toISOString().split('T')[0];
    return this.http.get<Task[]>(`${this.apiUrl}/tasks/date/${dateString}`);
  }

  // Get tasks by event type
  getTasksByEventType(eventType: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks?eventType=${eventType}`);
  }

  // Create a new task
  createTask(task: Task): Observable<any> {
    return this.http.post(`${this.apiUrl}/tasks`, {
      id: task.id,
      text: task.text,
      completed: task.completed,
      date: task.date.toISOString(),
      color: task.color,
      isRecurring: task.isRecurring,
      recurringDays: task.recurringDays,
      originalDate: task.originalDate?.toISOString(),
      eventType: task.eventType
    });
  }

  // Update a task
  updateTask(task: Task): Observable<any> {
    return this.http.put(`${this.apiUrl}/tasks/${task.id}`, {
      text: task.text,
      completed: task.completed,
      date: task.date.toISOString(),
      color: task.color,
      isRecurring: task.isRecurring,
      recurringDays: task.recurringDays,
      originalDate: task.originalDate?.toISOString(),
      eventType: task.eventType
    });
  }

  // Delete a task
  deleteTask(taskId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/${taskId}`);
  }

  // Delete all recurring tasks
  deleteRecurringTasks(text: string, originalDate: Date): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/recurring/${encodeURIComponent(text)}/${originalDate.toISOString()}`);
  }

  // Health check
  healthCheck(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
