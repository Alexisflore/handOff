import React from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProjectDashboard } from "@/components/project-stats/dashboard";
import { ProjectHistory } from "@/components/project-history";
import { ProjectFiles } from "@/components/project-files";
import { StepSelector } from "./StepSelector";
import { FilePreviewSection } from "./FilePreviewSection";
import { ActionFooter } from "./ActionFooter";

// Interface pour les props du composant
interface ClientPortalContentProps {
  activeTab: string;
  project: any;
  currentMilestone: string;
  isDeliverableSelectorOpen: boolean;
  projectSteps: any[];
  handleMilestoneClick: (stepId: string, showLatest?: boolean) => void;
  closeDeliverableSelector: () => void;
  currentUser: any;
  handleAddDeliverable: () => void;
  activeVersion: any;
  currentVersion: string;
  allStepVersions: any[];
  filteredComments: any[];
  handleSendComment: (content: string) => Promise<void>;
  handleVersionChange: (versionId: string) => void;
  handleAddNewVersion: (stepId?: string) => void;
  client: any;
  refreshProjectData: () => Promise<void>;
  comments: any[];
  sharedFiles: any[];
}

export function ClientPortalContent({
  activeTab,
  project,
  currentMilestone,
  isDeliverableSelectorOpen,
  projectSteps,
  handleMilestoneClick,
  closeDeliverableSelector,
  currentUser,
  handleAddDeliverable,
  activeVersion,
  currentVersion,
  allStepVersions,
  filteredComments,
  handleSendComment,
  handleVersionChange,
  handleAddNewVersion,
  client,
  refreshProjectData,
  comments,
  sharedFiles
}: ClientPortalContentProps) {
  return (
    <main className="flex flex-1 flex-col p-0 overflow-auto w-full">
      <Tabs
        value={activeTab}
        className="w-full h-full flex flex-col overflow-hidden"
      >
        <div className="overflow-auto flex-1 flex flex-col min-h-0 border-b border-slate-200 w-full">
          <TabsContent 
            value="dashboard" 
            className="flex-1 overflow-auto h-full w-full" 
            style={{
              display: "block", 
              width: "100%", 
              visibility: "visible"
            }}
            data-force-visible="true"
          >
            <div className="px-4 py-4 h-full w-full">
              <ProjectDashboard projectId={project.id} />
            </div>
          </TabsContent>

          <TabsContent 
            value="current" 
            className="flex-1 flex flex-col overflow-auto flex-grow w-full" 
            style={{display: activeTab === "current" ? "flex" : "none", width: "100%"}}
          >
            <div className="flex flex-col h-full justify-between space-y-4 px-4 pb-4">
              {/* Section de sélection des livrables */}
              <div className="flex flex-col space-y-4">
                <StepSelector
                  projectSteps={projectSteps.length > 0 ? projectSteps : []}
                  activeStepId={currentMilestone}
                  onStepSelect={handleMilestoneClick}
                  closeSelector={closeDeliverableSelector}
                  project={project}
                  isOpen={isDeliverableSelectorOpen}
                  onAddStep={currentUser?.isDesigner ? handleAddDeliverable : undefined}
                />
                
                {/* File Preview Section */}
                <FilePreviewSection 
                  activeVersion={activeVersion}
                  currentStepId={currentMilestone}
                  currentVersion={currentVersion}
                  allVersions={allStepVersions}
                  comments={filteredComments}
                  onSendComment={handleSendComment}
                  onVersionChange={handleVersionChange}
                  isDesigner={currentUser?.isDesigner || false}
                  onAddNewVersion={handleAddNewVersion}
                />
              </div>

              {/* Action footer */}
              <ActionFooter 
                activeVersion={activeVersion}
                clientId={client.id}
                userId={currentUser?.id}
                onRefresh={refreshProjectData}
              />
            </div>
          </TabsContent>

          <TabsContent 
            value="history" 
            className="flex-1 overflow-auto flex-grow w-full" 
            style={{display: activeTab === "history" ? "block" : "none", width: "100%"}}
          >
            <div className="px-4 py-4 h-full">
              <ProjectHistory milestones={projectSteps} onViewVersion={handleVersionChange} comments={comments} />
            </div>
          </TabsContent>

          <TabsContent 
            value="my-files" 
            className="flex-1 overflow-auto flex-grow w-full" 
            style={{display: activeTab === "my-files" ? "block" : "none", width: "100%"}}
          >
            <div className="px-4 py-4 h-full">
              <ProjectFiles
                files={sharedFiles}
                projectId={project.id}
                clientId={client.id}
                onFileDeleted={refreshProjectData}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </main>
  );
} 