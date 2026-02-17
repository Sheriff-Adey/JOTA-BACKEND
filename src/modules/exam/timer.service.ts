// timer.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class TimerService {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  startExamTimer(examId: string, candidateId: string): void {
    // Adjust the time limit as needed
    const timeLimit = 60 * 30 * 1000; // 30 minutes in milliseconds

    const timer = setTimeout(() => {
      // Automatically submit the exam when the time limit elapses
      this.submitExam(examId, candidateId);

      // Remove the timer
      this.timers.delete(examId);
    }, timeLimit);

    // Store the timer reference
    this.timers.set(examId, timer);
  }

  stopExamTimer(examId: string): void {
    if (this.timers.has(examId)) {
      clearTimeout(this.timers.get(examId));
      this.timers.delete(examId);
    }
  }

  private submitExam(examId: string, candidateId: string): void {
    // Implement your logic to submit the exam
  }
}
