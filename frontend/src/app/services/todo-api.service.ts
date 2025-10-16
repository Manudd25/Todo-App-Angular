import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../calendar/calendar.component';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TodoApiService {
  private apiUrl = 'https://todolist-angular-a7f8acezg7dgd8gk.westeurope-01.azurewebsites.net/api';

  constructor(private http: HttpClient, private authService: AuthService) { }

  // Get all tasks
  getAllTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`, { headers: this.authService.getAuthHeaders() });
  }

  // Get tasks for a specific date
  getTasksForDate(date: Date): Observable<Task[]> {
    const dateString = date.toISOString().split('T')[0];
    return this.http.get<Task[]>(`${this.apiUrl}/tasks/date/${dateString}`, { headers: this.authService.getAuthHeaders() });
  }

  // Get tasks by event type
  getTasksByEventType(eventType: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks?eventType=${eventType}`, { headers: this.authService.getAuthHeaders() });
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
    }, { headers: this.authService.getAuthHeaders() });
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
    }, { headers: this.authService.getAuthHeaders() });
  }

  // Delete a task
  deleteTask(taskId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/${taskId}`, { headers: this.authService.getAuthHeaders() });
  }

  // Delete all recurring tasks
  deleteRecurringTasks(text: string, originalDate: Date): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/recurring/${encodeURIComponent(text)}/${originalDate.toISOString()}`, { headers: this.authService.getAuthHeaders() });
  }

  // Health check
  healthCheck(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
