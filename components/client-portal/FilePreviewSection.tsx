"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Download, MessageSquare, Plus, FileX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilePreview } from "@/components/file-preview"
import { CommentThread } from "@/components/steps-comment/CommentThread"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Version, Comment } from "./types"
import { AddButton } from "@/components/ui/add-button"
import { BreadcrumbButton } from "@/components/ui/breadcrumb-button"
import { DropdownIndicator } from "@/components/ui/dropdown-indicator"

interface FilePreviewSectionProps {
  activeVersion: Version | null
  currentStepId: string
  currentVersion: string
  allVersions: Version[]
  comments: Comment[]
  onSendComment: (content: string) => Promise<void>
  onVersionChange: (versionId: string) => void
  isDesigner: boolean
  onAddNewVersion: (stepId?: string) => void
}

// Type adapté pour les commentaires du thread
interface ThreadComment {
  id: string
  author: {
    name: string
    avatar?: string
    initials: string
  }
  content: string
  timestamp: string
  milestoneId: string
  milestoneName: string
  versionId: string
  versionName: string
  isClient: boolean
}

export function FilePreviewSection({
  activeVersion,
  currentStepId,
  currentVersion,
  allVersions,
  comments,
  onSendComment,
  onVersionChange,
  isDesigner,
  onAddNewVersion
}: FilePreviewSectionProps) {
  const [showComments, setShowComments] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [showVersionDropdown, setShowVersionDropdown] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  
  // Effet pour montrer un indicateur de chargement à chaque changement de version
  useEffect(() => {
    setIsLoading(true)
    
    // Log pour débogage
    console.log("[FilePreviewSection] Changement de version:", {
      currentVersion: currentVersion,
      activeVersion: activeVersion ? {
        id: activeVersion.id,
        nom: activeVersion.version_name,
        url: activeVersion.file_url,
        livrable: activeVersion.deliverable_title
      } : "Aucune",
      nbVersions: allVersions.length
    });
    
    // Log des informations sur le fichier affiché
    if (activeVersion) {
      console.log("[FilePreviewSection] Affichage fichier:", {
        fichier: activeVersion.file_name,
        type: activeVersion.file_type,
        url: activeVersion.file_url || "URL manquante"
      });
    }
    
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [currentStepId, currentVersion, activeVersion, allVersions.length])

  // Effet pour sélectionner la version la plus récente par défaut - maintenant à chaque ouverture du composant
  useEffect(() => {
    if (allVersions.length > 0) {
      // Tri des versions par date de création (plus récent d'abord)
      const sortedVersions = [...allVersions].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      const mostRecentVersion = sortedVersions[0];
      
      console.log("[FilePreviewSection] Versions triées:", sortedVersions.map(v => ({
        id: v.id,
        name: v.version_name,
        date: v.created_at
      })));
      
      // Vérifier si la version actuelle n'est pas la plus récente, auquel cas sélectionner la plus récente
      if (!activeVersion || activeVersion.id !== mostRecentVersion.id) {
        console.log("[FilePreviewSection] Sélection de la version la plus récente:", {
          id: mostRecentVersion.id,
          name: mostRecentVersion.version_name,
          date: mostRecentVersion.created_at
        });
        onVersionChange(mostRecentVersion.id);
      }
      
      // Marquer l'initialisation comme terminée même si on ne change pas la version
      setHasInitialized(true);
    }
  }, [allVersions, currentStepId]); // Dépend uniquement des versions disponibles et de l'étape actuelle

  // Adapter les commentaires pour le composant CommentThread
  const commentsForThread = comments.map((c) => ({
    id: c.id,
    author: {
      name: c.users.full_name,
      avatar: c.users.avatar_url,
      initials: c.users.full_name ? c.users.full_name.charAt(0) : "U",
    },
    content: c.content,
    timestamp: new Date(c.created_at).toLocaleString(),
    milestoneId: currentStepId,  // L'ID de l'étape actuelle
    milestoneName: c.deliverable_name || "Current Deliverable",
    versionId: c.deliverable_id,  // ID du livrable auquel appartient le commentaire
    versionName: c.version_name || "Version inconnue",
    isClient: c.is_client,
  })) as ThreadComment[]

  // Débogage des commentaires
  useEffect(() => {
    console.log("[FilePreviewSection DEBUG] Commentaires fournis au thread:", {
      total: commentsForThread.length,
      currentStepId,
      currentVersion,
      commentaires: commentsForThread.map(c => ({
        id: c.id, 
        milestoneId: c.milestoneId,
        versionId: c.versionId,
        versionName: c.versionName
      }))
    });
  }, [commentsForThread, currentStepId, currentVersion]);

  // Fonction pour basculer l'affichage des commentaires
  const toggleComments = () => {
    setShowComments(!showComments)
  }
  
  // Fonction pour basculer l'affichage du menu déroulant des versions
  const toggleVersionDropdown = () => {
    setShowVersionDropdown(!showVersionDropdown)
  }
  
  // Fonction pour sélectionner une version
  const handleVersionSelect = (versionId: string) => {
    console.log("[FilePreviewSection] Changement de version:", versionId);
    onVersionChange(versionId)
    setShowVersionDropdown(false)
  }

  // Fonction pour obtenir le nom de version avec un préfixe numéroté
  const getFormattedVersionName = (version: Version, versions: Version[]) => {
    // Trier toutes les versions par date (plus récente d'abord) pour obtenir l'index
    const sortedVersions = [...versions].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Trouver l'index de cette version (0-based)
    const versionIndex = sortedVersions.findIndex(v => v.id === version.id);
    
    // Formater le nom (sans numéro)
    const versionName = version.version_name || "Version sans nom";
    
    // Calculer le numéro (la plus récente = numéro le plus élevé)
    const versionNumber = versions.length - versionIndex;
    
    return {
      name: versionName,
      number: versionNumber
    };
  };

  return (
    <div className="flex flex-1 flex-col lg:flex-row gap-4 h-full max-h-[70vh] overflow-auto">
      {/* Left column - File preview */}
      <div className={`flex-1 ${showComments ? "lg:w-2/3" : "lg:w-full"} flex flex-col h-full`}>
        <Card className={`flex flex-col shadow-sm hover:shadow transition-shadow duration-200 border-slate-200 overflow-auto h-full ${isLoading ? 'animate-pulse' : ''}`}>
          {allVersions.length === 0 ? (
            // Interface simplifiée pour les étapes sans livrables
            <div className="flex flex-col items-center justify-center p-8 h-full text-center">
              <div className="rounded-full bg-slate-100 p-4 mb-4">
                <FileX className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-medium text-slate-800 mb-3">Étape sans livrable</h3>
              <p className="text-sm text-slate-500 max-w-md mb-6">
                {isDesigner 
                  ? "Cette étape n'a pas encore de livrable. Vous pouvez en ajouter un maintenant." 
                  : "Cette étape est en attente de livrables. Ils seront disponibles prochainement."}
              </p>
              {isDesigner && (
                <AddButton 
                  label="Ajouter un livrable"
                  onClick={() => onAddNewVersion(currentStepId)}
                  style="normal"
                  color="blue"
                  className="w-full max-w-xs"
                />
              )}
            </div>
          ) : (
            // Interface standard avec sélecteur de version et prévisualisation
            <>
              <CardHeader className="flex-row items-center justify-between space-y-0 py-3 px-4 border-b flex-shrink-0">
                <div className="flex items-center gap-3">
                  {/* Version selector dropdown */}
                  <div className="relative">
                    <BreadcrumbButton
                      label={activeVersion ? getFormattedVersionName(activeVersion, allVersions).name : "Version 1"}
                      showDropdownIndicator
                      isDropdownOpen={showVersionDropdown}
                      onClick={toggleVersionDropdown}
                      badge={{
                        text: activeVersion ? getFormattedVersionName(activeVersion, allVersions).number.toString() : "1",
                        variant: "outline",
                        status: "default"
                      }}
                      className={activeVersion && activeVersion.id === [...allVersions].sort((a, b) => 
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                      )[0]?.id ? "after:content-['Latest'] after:ml-2 after:text-xs after:font-medium after:text-blue-700 after:bg-blue-50 after:px-1.5 after:py-0.5 after:rounded-md" : ""}
                    />
                    
                    {/* Dropdown menu for versions */}
                    {activeVersion && (
                      <div 
                        className={`absolute left-0 top-full mt-1 z-50 w-88 ${showVersionDropdown ? 'block' : 'hidden'}`}
                      >
                        <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-60 overflow-y-auto">
                          <div className="px-2 py-1.5 mb-1 border-b border-slate-100">
                            <h3 className="text-sm font-medium text-slate-700">Versions disponibles</h3>
                          </div>
                          {/* Liste complète des versions sans séparation spéciale pour la version actuelle */}
                          {[...allVersions]
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((version, index) => (
                              <div 
                                key={version.id}
                                className={`px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 cursor-pointer ${
                                  version.id === activeVersion.id ? 'bg-blue-50 font-medium' : ''
                                }`}
                                onClick={() => handleVersionSelect(version.id)}
                              >
                                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 px-1.5 py-0" variant="secondary">
                                  {getFormattedVersionName(version, allVersions).number}
                                </Badge>
                                <span className="truncate overflow-hidden max-w-[180px]">
                                  {getFormattedVersionName(version, allVersions).name}
                                  {version.deliverable_title && version.deliverable_title.trim() !== "" && 
                                    <span className="text-xs ml-2 text-gray-600">({version.deliverable_title})</span>
                                  }
                                </span>
                                {version.id === [...allVersions].sort((a, b) => 
                                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                )[0]?.id && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">Latest</Badge>
                                )}
                                <span className="text-xs text-gray-500 ml-auto">
                                  {new Date(version.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            ))
                          }
                          
                          {/* Bouton d'ajout de version dans le dropdown (visible seulement pour les designers) */}
                          {isDesigner && (
                            <div className="px-3 py-2 border-t border-gray-100 mt-1">
                              <AddButton 
                                label="Ajouter une version" 
                                style="compact"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setShowVersionDropdown(false);
                                  
                                  if (typeof onAddNewVersion === 'function') {
                                    // Log explicitly before calling to verify the ID is correct
                                    console.log("🔴 CRITICAL - Adding version from dropdown with step ID:", currentStepId);
                                    
                                    // Sauvegarder également l'ID dans sessionStorage pour assurer la persistance
                                    try {
                                      sessionStorage.setItem('lastSelectedStepId', currentStepId);
                                      console.log("Step ID sauvegardé dans sessionStorage:", currentStepId);
                                    } catch (e) {
                                      console.error("Erreur de sauvegarde dans sessionStorage:", e);
                                    }
                                    
                                    onAddNewVersion(currentStepId);
                                    
                                    // Forcer l'ouverture du modal
                                    setTimeout(() => {
                                      const modalElement = document.getElementById('version-modal-container');
                                      if (modalElement) {
                                        modalElement.style.display = 'flex';
                                        console.log("Modal forcé depuis le menu déroulant");
                                        document.body.style.overflow = 'hidden';
                                      } else {
                                        // Si le modal principal n'est pas trouvé, utiliser le modal de secours
                                        const backupModal = document.getElementById('backup-version-modal');
                                        if (backupModal) {
                                          backupModal.style.display = 'flex';
                                          console.log("Modal de secours utilisé depuis le menu déroulant");
                                          document.body.style.overflow = 'hidden';
                                        } else {
                                          console.error("Aucun modal disponible");
                                        }
                                      }
                                    }, 100);
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Bouton "Add a new version" visible uniquement pour les designers */}
                  {isDesigner && (
                    <AddButton
                      label="Ajouter une version"
                      tooltipText="Ajouter une version"
                      style="icon-only"
                      color="blue"
                      iconSize={12}
                      className="h-8 w-8 flex items-center justify-center"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Added CRITICAL LOG
                        console.log("🔴 CRITICAL - Add new version button clicked with step ID:", currentStepId);
                        
                        // Sauvegarder également l'ID dans sessionStorage pour assurer la persistance
                        try {
                          sessionStorage.setItem('lastSelectedStepId', currentStepId);
                          console.log("Step ID sauvegardé dans sessionStorage:", currentStepId);
                        } catch (e) {
                          console.error("Erreur de sauvegarde dans sessionStorage:", e);
                        }
                        
                        // Approche double: appeler la fonction et manipuler directement le DOM
                        if (typeof onAddNewVersion === 'function') {
                          onAddNewVersion(currentStepId);
                          
                          // Forcer l'affichage du modal via le DOM en cas d'échec de l'approche React
                          setTimeout(() => {
                            const modalElement = document.getElementById('version-modal-container');
                            if (modalElement) {
                              modalElement.style.display = 'flex';
                              console.log("Modal forcé directement depuis le bouton");
                              document.body.style.overflow = 'hidden';
                            } else {
                              // Si le modal principal n'est pas trouvé, utiliser le modal de secours
                              const backupModal = document.getElementById('backup-version-modal');
                              if (backupModal) {
                                backupModal.style.display = 'flex';
                                console.log("Modal de secours utilisé");
                                document.body.style.overflow = 'hidden';
                              } else {
                                console.error("Aucun modal disponible");
                              }
                            }
                          }, 100);
                        } else {
                          console.error("onAddNewVersion is not a function");
                        }
                      }}
                    />
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          if (activeVersion?.file_url) {
                            window.open(activeVersion.file_url, '_blank');
                          }
                        }}
                        disabled={!activeVersion?.file_url}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Télécharger le fichier</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={toggleComments}>
                        <MessageSquare className="h-4 w-4" />
                        <span className="sr-only">Toggle Comments</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{showComments ? "Masquer les commentaires" : "Afficher les commentaires"}</TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto">
                {activeVersion && activeVersion.file_url ? (
                  <FilePreview
                    fileName={activeVersion.file_name || "preview"}
                    fileType={(activeVersion.file_type === "pdf" ? "pdf" : "image") as "image" | "pdf" | "other"}
                    fileUrl={activeVersion.file_url}
                  />
                ) : (
                  <div className="flex items-center justify-center p-8 h-full">
                    <p className="text-slate-500">Sélectionnez une version pour afficher l'aperçu</p>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* Right column - Comments */}
      {showComments && (
        <div className="lg:w-1/3 flex flex-col h-full overflow-hidden">
          <CommentThread 
            allComments={commentsForThread} 
            currentMilestone={currentStepId}
            currentVersion={currentVersion}
            onSendComment={onSendComment}
            defaultFilter="deliverable"
          />
        </div>
      )}
    </div>
  )
} 