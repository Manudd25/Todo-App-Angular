import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Task {
  text: string;
  completed: boolean;
}

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.css'
})
export class TodoComponent {
  tasks: Task[] = [];
  newTask: string = '';

  addTask() {
    if (this.newTask.trim()) {
      this.tasks.push({ text: this.newTask, completed: false });
      this.newTask = '';
    }
  }

  toggleTask(index: number) {
    this.tasks[index].completed = !this.tasks[index].completed;
  }

  deleteTask(index: number) {
    this.tasks.splice(index, 1);
  }
}


