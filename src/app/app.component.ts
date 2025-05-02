import { Component, OnInit, HostListener } from '@angular/core';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { of, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ViewEncapsulation } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
}

// Mock API functions (replace with actual API calls)
const mockApi = {
  getTasks: async (): Promise<Task[]> => {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Simulate API response
    return [
      {
        id: '1',
        title: 'Plan the project',
        description: 'Define goals and milestones',
        status: 'To Do',
      },
      {
        id: '2',
        title: 'Design the UI',
        description: 'Create wireframes and mockups',
        status: 'In Progress',
      },
      {
        id: '3',
        title: 'Implement backend',
        description: 'Set up the server and database',
        status: 'In Progress',
      },
      {
        id: '4',
        title: 'Write unit tests',
        description: 'Ensure code quality',
        status: 'To Do',
      },
      {
        id: '5',
        title: 'Deploy to staging',
        description: 'Set up the deployment pipeline',
        status: 'Done',
      },
    ];
  },
  createTask: async (newTask: Omit<Task, 'id'>): Promise<Task> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const id = crypto.randomUUID();
    return { ...newTask, id };
  },
  updateTask: async (
    id: string,
    updates: Partial<Omit<Task, 'id'>>
  ): Promise<Task> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      id,
      title: updates.title || 'Updated Task',
      description: updates.description || '',
      status: (updates.status || 'To Do') as Task['status'],
    };
  },
  deleteTask: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // Simulate deletion
    return;
  },
  updateTaskStatus: async (
    id: string,
    newStatus: Task['status']
  ): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // Simulate updating task status
    console.log(`Task ${id} status updated to ${newStatus}`);
  },
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('taskVariants', [
      state('hidden', style({ opacity: 0, transform: 'translateY(-10px)' })),
      state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('hidden => visible', animate('0.2s')),
      transition('visible => hidden', animate('0.1s')),
      transition('* => void', [
        animate('0.1s', style({ opacity: 0, transform: 'translateY(10px)' })),
      ]),
    ]),
  ],
  encapsulation: ViewEncapsulation.None, // Add this line
})
export class AppComponent implements OnInit {
  tasks: Task[] = [];
  loading = true;
  error: string | null = null;
  isModalOpen = false;
  newTask: Omit<Task, 'id'> = { title: '', description: '', status: 'To Do' };
  isLoading = false;
  columns: { title: string; status: Task['status'] }[] = [
    { title: 'To Do', status: 'To Do' },
    { title: 'In Progress', status: 'In Progress' },
    { title: 'Done', status: 'Done' },
  ];
  isDragging = false;
  private http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  ngOnInit() {
    this.fetchData();
    this.loadLucideIcons();
  }

  loadLucideIcons() {
    const script = document.createElement('script');
    script.src =
      'https://unpkg.com/lucide-react@latest/umd/lucide-react.min.js';
    script.async = true;
    document.head.appendChild(script);
  }

  fetchData = async () => {
    this.loading = true;
    this.error = null;
    try {
      const fetchedTasks = await mockApi.getTasks(); // Use mock API to fetch tasks
      this.tasks = fetchedTasks;
    } catch (err: any) {
      this.error = err.message || 'Failed to fetch tasks';
    } finally {
      this.loading = false;
    }
  };

  addTask = async () => {
    if (!this.newTask.title.trim()) {
      this.error = 'Title is required';
      return;
    }
    this.isLoading = true;
    this.error = null;
    try {
      const createdTask = await mockApi.createTask(this.newTask);
      this.tasks = [...this.tasks, createdTask];
      this.newTask = { title: '', description: '', status: 'To Do' }; // Reset the form
      this.closeDialog();
    } catch (err: any) {
      this.error = err.message || 'Failed to add task';
    } finally {
      this.isLoading = false;
    }
  };

  moveTask = async (id: string, newStatus: Task['status']) => {
    try {
      const updatedTask = await mockApi.updateTask(id, { status: newStatus });
      this.tasks = this.tasks.map((task) =>
        task.id === id ? { ...task, status: newStatus } : task
      );
    } catch (error: any) {
      this.error = error.message || 'Failed to move task';
    }
  };

  deleteTask = async (id: string) => {
    try {
      await mockApi.deleteTask(id);
      this.tasks = this.tasks.filter((task) => task.id !== id);
    } catch (error: any) {
      this.error = error.message || 'Failed to delete task';
    }
  };

  getTasksByStatus(status: Task['status']): Task[] {
    return this.tasks.filter((task) => task.status === status);
  }

  async updateTaskStatus(id: string, newStatus: Task['status']) {
    try {
      await mockApi.updateTaskStatus(id, newStatus);
      this.tasks = this.tasks.map((task) => {
        if (task.id === id) {
          return { ...task, status: newStatus };
        }
        return task;
      });
    } catch (error: any) {
      this.error = error.message;
    }
  }
  openDialog() {
    this.isModalOpen = true;
  }

  closeDialog() {
    this.isModalOpen = false;
    this.error = null; // Clear any errors when the modal is closed
    this.newTask = { title: '', description: '', status: 'To Do' };
  }

  onAnimationDone(event: any) {
    // You can leave this empty for now.  It's needed for the animation.
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      const movedTask: Task = event.previousContainer.data[event.previousIndex];
      const newStatus = event.container.id as Task['status'];

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.moveTask(movedTask.id, newStatus);
    }
    this.isDragging = false;
  }

  @HostListener('dragstart')
  onDragStart() {
    this.isDragging = true;
  }

  @HostListener('dragend')
  onDragEnd() {
    this.isDragging = false;
  }
}
