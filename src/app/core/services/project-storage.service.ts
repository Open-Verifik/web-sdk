import { Injectable } from "@angular/core";
import { Project } from "../classes/project.class";
import { ProjectFlow } from "../classes/project-flow.class";
import { Project as ProjectInterface, SmartEnrollProjectFlow } from "../models/smart-enroll-project.model";

@Injectable({
    providedIn: "root",
})
export class ProjectStorageService {
    private readonly PROJECT_KEY = "project";
    private readonly PROJECT_FLOW_KEY = "projectFlow";

    getProject(): Project | null {
        const projectData = localStorage.getItem(this.PROJECT_KEY);

        if (!projectData) return null;

        try {
            const parsed = JSON.parse(projectData);

            return new Project(parsed);
        } catch (error) {
            console.error("Error loading project from localStorage:", error);

            return null;
        }
    }

    setProject(project: Project): void {
        try {
            let projectToStore: ProjectInterface;

            if (project instanceof Project) {
                projectToStore = project.toJSON();
            } else {
                projectToStore = project;
            }

            localStorage.setItem(this.PROJECT_KEY, JSON.stringify(projectToStore));
        } catch (error) {
            console.error("Error saving project to localStorage:", error);
        }
    }

    getProjectFlow(): ProjectFlow | null {
        const projectFlowData = localStorage.getItem(this.PROJECT_FLOW_KEY);

        if (!projectFlowData) return null;

        try {
            const parsed = JSON.parse(projectFlowData);

            return new ProjectFlow(parsed);
        } catch (error) {
            console.error("Error loading projectFlow from localStorage:", error);

            return null;
        }
    }

    setProjectFlow(projectFlow: ProjectFlow): void {
        try {
            let projectFlowToStore: SmartEnrollProjectFlow;

            if (projectFlow instanceof ProjectFlow) {
                projectFlowToStore = projectFlow.toJSON();
            } else {
                projectFlowToStore = projectFlow;
            }

            localStorage.setItem(this.PROJECT_FLOW_KEY, JSON.stringify(projectFlowToStore));
        } catch (error) {
            console.error("Error saving projectFlow to localStorage:", error);
        }
    }
}
