import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../calendar/calendar.component';

@Injectable({
  providedIn: 'root'
})
export class TodoApiService {
  private apiUrl = 'https://onlinecalendar-bpc5e2fcgvgzgneq.westeurope-01.azurewebsites.net/api';

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
  createTask(task: Task): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, task);
  }

  // Update a task
  updateTask(task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${task.id}`, task);
  }

  // Delete a task
  deleteTask(taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${taskId}`);
  }

  // Delete all recurring tasks
  deleteRecurringTasks(text: string, originalDate: Date): Observable<void> {
    const originalDateString = originalDate.toISOString().split('T')[0];
    return this.http.delete<void>(`${this.apiUrl}/tasks/recurring/${text}/${originalDateString}`);
  }
}
