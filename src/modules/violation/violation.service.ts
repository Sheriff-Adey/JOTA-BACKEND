import { Injectable, Inject } from '@nestjs/common';
import { Violation } from './violation.entity';
import { ApiResponse } from 'src/app.interface';

@Injectable()
export class ViolationService {
  constructor(
    @Inject('VIOLATIONS_REPOSITORY')
    private violationRepository: typeof Violation,
  ) {}

  async createViolation(data: {
    examId: string;
    candidateId: string;
    violationType: string;
    violationReason: string;
    metadata?: object;
  }): Promise<Violation> {
    return await this.violationRepository.create({
      examId: data.examId,
      candidateId: data.candidateId,
      violationType: data.violationType,
      violationReason: data.violationReason,
      metadata: data.metadata || {},
    });
  }

  async getViolationsByExam(examId: string): Promise<ApiResponse> {
    try {
      const violations = await this.violationRepository.findAll({
        where: { examId },
        order: [['createdAt', 'DESC']],
      });

      return {
        status: 200,
        message: 'Violations retrieved successfully',
        data: violations,
        error: false,
      };
    } catch (e) {
      console.error('Error getting violations:', e);
      return {
        status: 500,
        message: `Internal Server Error: ${e.message}`,
        error: true,
      };
    }
  }

  async getViolationsByCandidate(examId: string, candidateId: string): Promise<ApiResponse> {
    try {
      const violations = await this.violationRepository.findAll({
        where: { examId, candidateId },
        order: [['createdAt', 'DESC']],
      });

      return {
        status: 200,
        message: 'Candidate violations retrieved successfully',
        data: violations,
        error: false,
      };
    } catch (e) {
      console.error('Error getting candidate violations:', e);
      return {
        status: 500,
        message: `Internal Server Error: ${e.message}`,
        error: true,
      };
    }
  }

  async getViolationCandidates(examId: string): Promise<ApiResponse> {
    try {
      // Get all unique candidates who have violations
      const violations = await this.violationRepository.findAll({
        where: { examId },
        order: [['createdAt', 'DESC']],
      });

      // Group violations by candidate
      const candidateViolationsMap = new Map<string, Violation[]>();
      
      for (const violation of violations) {
        const existing = candidateViolationsMap.get(violation.candidateId) || [];
        existing.push(violation);
        candidateViolationsMap.set(violation.candidateId, existing);
      }

      // Convert to candidate-violation summary format
      const violationCandidates = Array.from(candidateViolationsMap.entries()).map(([candidateId, violationList]) => {
        const firstViolation = violationList[0];
        const lastViolation = violationList[violationList.length - 1];
        
        // Count violations by type
        const violationCounts: Record<string, number> = {};
        for (const v of violationList) {
          violationCounts[v.violationType] = (violationCounts[v.violationType] || 0) + 1;
        }

        return {
          candidateId,
          username: (firstViolation as any).candidate?.username || 'Unknown',
          email: (firstViolation as any).candidate?.email || '',
          submissionType: this.getSubmissionTypeFromViolations(violationList),
          submissionReason: firstViolation.violationReason,
          submittedAt: lastViolation.createdAt,
          totalViolations: violationList.length,
          violationCounts,
          violations: violationList,
        };
      });

      // Sort by most recent violation
      violationCandidates.sort((a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );

      return {
        status: 200,
        message: 'Violation candidates retrieved successfully',
        data: {
          count: violationCandidates.length,
          violations: violationCandidates,
        },
        error: false,
      };
    } catch (e) {
      console.error('Error getting violation candidates:', e);
      return {
        status: 500,
        message: `Internal Server Error: ${e.message}`,
        error: true,
      };
    }
  }

  private getSubmissionTypeFromViolations(violations: Violation[]): string {
    // Determine the primary submission type based on violation types
    const types = violations.map(v => v.violationType);
    
    if (types.includes('fullscreen')) return 'fullscreen';
    if (types.includes('window_exit')) return 'window_exit';
    if (types.includes('app_switching')) return 'app_switching';
    if (types.includes('inactivity')) return 'inactivity';
    if (types.includes('tab_switch')) return 'tab_switch';
    
    return 'violation';
  }
}
