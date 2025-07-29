import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText,
  Download,
  RefreshCw,
  BarChart3,
  Database,
  Layers,
  Settings,
  Clock,
  TrendingUp,
  Package,
  Zap,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppAnalysisService, AppAnalysisData } from '@/services/appAnalysisService';

export function AppAnalysisDashboard() {
  const [analysisData, setAnalysisData] = useState<AppAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Carica l'ultima analisi dal localStorage
    loadLastAnalysis();
  }, []);

  const loadLastAnalysis = () => {
    try {
      const lastAnalysis = localStorage.getItem('app_analysis_latest');
      if (lastAnalysis) {
        const data = JSON.parse(lastAnalysis);
        setAnalysisData(data);
        setLastUpdate(data.timestamp);
      }
    } catch (error) {
      console.error('Failed to load last analysis:', error);
    }
  };

  const generateAnalysis = async () => {
    setIsLoading(true);
    try {
      const data = await AppAnalysisService.generateAnalysis();
      setAnalysisData(data);
      setLastUpdate(data.timestamp);
      
      // Salva l'analisi localmente
      await AppAnalysisService.saveAnalysisLocally(data);
      
      toast({
        title: "✅ Analisi Completata",
        description: "Report generato con successo e salvato localmente"
      });
    } catch (error) {
      console.error('Failed to generate analysis:', error);
      toast({
        title: "Errore Analisi",
        description: "Impossibile generare il report",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToJSON = async () => {
    if (!analysisData) return;
    
    try {
      const jsonData = await AppAnalysisService.exportToJSON(analysisData);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `app-analysis-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "📁 Export Completato",
        description: "Report JSON scaricato con successo"
      });
    } catch (error) {
      console.error('Failed to export JSON:', error);
      toast({
        title: "Errore Export",
        description: "Impossibile esportare in formato JSON",
        variant: "destructive"
      });
    }
  };

  const exportToMarkdown = async () => {
    if (!analysisData) return;
    
    try {
      const markdownData = await AppAnalysisService.exportToMarkdown(analysisData);
      const blob = new Blob([markdownData], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `app-analysis-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "📄 Export Completato",
        description: "Report Markdown scaricato con successo"
      });
    } catch (error) {
      console.error('Failed to export markdown:', error);
      toast({
        title: "Errore Export",
        description: "Impossibile esportare in formato Markdown",
        variant: "destructive"
      });
    }
  };

  const OverviewCard = ({ title, value, icon: Icon, description, status }: {
    title: string;
    value: string | number;
    icon: any;
    description: string;
    status?: 'good' | 'warning' | 'error';
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {status && (
          <Badge 
            variant={status === 'good' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}
            className="mt-2"
          >
            {status === 'good' && <CheckCircle className="h-3 w-3 mr-1" />}
            {status === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {status === 'error' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analisi Stato Applicazione</h2>
          <p className="text-muted-foreground">
            Report completo su architettura, performance e configurazioni
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generateAnalysis}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Genera Analisi
              </>
            )}
          </Button>
          {analysisData && (
            <>
              <Button onClick={exportToJSON} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
              <Button onClick={exportToMarkdown} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Markdown
              </Button>
            </>
          )}
        </div>
      </div>

      {lastUpdate && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Ultimo aggiornamento: {new Date(lastUpdate).toLocaleString('it-IT')}
        </div>
      )}

      {!analysisData && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessuna Analisi Disponibile</h3>
            <p className="text-muted-foreground text-center mb-4">
              Genera un'analisi completa dell'applicazione per visualizzare tutti i dettagli
            </p>
            <Button onClick={generateAnalysis} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generando Analisi...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Genera Prima Analisi
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {analysisData && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <OverviewCard
              title="Pagine Totali"
              value={analysisData.pages.length}
              icon={Layers}
              description="Route e componenti principali"
              status="good"
            />
            <OverviewCard
              title="Componenti"
              value={analysisData.components.length}
              icon={Package}
              description="Componenti riusabili"
              status="good"
            />
            <OverviewCard
              title="Tabelle DB"
              value={analysisData.database.tables.length}
              icon={Database}
              description="Schema database"
              status="good"
            />
            <OverviewCard
              title="Integrazioni"
              value={analysisData.integrations.length}
              icon={Settings}
              description="Servizi di terze parti"
              status="good"
            />
          </div>

          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pages">Pagine</TabsTrigger>
              <TabsTrigger value="components">Componenti</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="architecture">Architettura</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="scalability">Scalabilità</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Statistiche Generali
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Versione App:</span>
                      <Badge>{analysisData.version}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Custom Hooks:</span>
                      <span className="font-medium">{analysisData.hooks.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Servizi:</span>
                      <span className="font-medium">{analysisData.services.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Funzioni DB:</span>
                      <span className="font-medium">{analysisData.database.functions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dipendenze:</span>
                      <span className="font-medium">{analysisData.dependencies.length}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Performance Snapshot
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Bundle Size:</span>
                      <span className="font-medium">{analysisData.performance.metrics.bundleSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Load Time:</span>
                      <span className="font-medium">{analysisData.performance.metrics.loadTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>API Response:</span>
                      <span className="font-medium">{analysisData.performance.metrics.apiResponseTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ottimizzazioni:</span>
                      <span className="font-medium">{analysisData.performance.optimizations.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Problemi:</span>
                      <Badge variant={analysisData.performance.issues.length > 0 ? 'destructive' : 'default'}>
                        {analysisData.performance.issues.length}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pages" className="space-y-4">
              <div className="grid gap-4">
                {analysisData.pages.map((page, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {page.name}
                        <Badge variant={page.authRequired ? 'default' : 'secondary'}>
                          {page.authRequired ? 'Protetta' : 'Pubblica'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{page.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div><strong>Path:</strong> {page.path}</div>
                        <div><strong>File:</strong> {page.filePath}</div>
                        <div><strong>Componenti:</strong> {page.components.join(', ')}</div>
                        <div><strong>Dipendenze:</strong> {page.dependencies.join(', ')}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="components" className="space-y-4">
              <div className="grid gap-4">
                {analysisData.components.map((component, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {component.name}
                        <div className="flex gap-2">
                          <Badge variant="outline">{component.type}</Badge>
                          <Badge variant={
                            component.reusability === 'High' ? 'default' : 
                            component.reusability === 'Medium' ? 'secondary' : 'destructive'
                          }>
                            {component.reusability} Reusability
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div><strong>File:</strong> {component.filePath}</div>
                        <div><strong>Props:</strong> {component.props.join(', ')}</div>
                        <div><strong>Hooks:</strong> {component.hooks.join(', ')}</div>
                        <div><strong>Dipendenze:</strong> {component.dependencies.join(', ')}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="database" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tabelle Database</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      {analysisData.database.tables.map((table, index) => (
                        <div key={index} className="border-b py-3 last:border-b-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{table.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {table.columns.length} colonne, {table.foreignKeys.length} foreign keys
                              </p>
                            </div>
                            <Badge variant="outline">
                              {table.triggers.length} triggers
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Funzioni Database</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      {analysisData.database.functions.map((func, index) => (
                        <div key={index} className="border-b py-3 last:border-b-0">
                          <h4 className="font-medium">{func.name}</h4>
                          <p className="text-sm text-muted-foreground">{func.purpose}</p>
                          <div className="text-xs text-muted-foreground mt-1">
                            Returns: {func.returnType}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="architecture" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Architettura Generale</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Pattern Architetturale</h4>
                        <p className="text-muted-foreground">{analysisData.architecture.pattern}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Frontend</h4>
                          <ul className="text-sm space-y-1">
                            <li><strong>Framework:</strong> {analysisData.architecture.frontend.framework}</li>
                            <li><strong>State:</strong> {analysisData.architecture.frontend.stateManagement}</li>
                            <li><strong>Routing:</strong> {analysisData.architecture.frontend.routing}</li>
                            <li><strong>Styling:</strong> {analysisData.architecture.frontend.styling}</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Backend</h4>
                          <ul className="text-sm space-y-1">
                            <li><strong>Type:</strong> {analysisData.architecture.backend.type}</li>
                            <li><strong>Database:</strong> {analysisData.architecture.backend.database}</li>
                            <li><strong>Auth:</strong> {analysisData.architecture.backend.authentication}</li>
                            <li><strong>API:</strong> {analysisData.architecture.backend.api}</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Deployment</h4>
                          <ul className="text-sm space-y-1">
                            <li><strong>Platform:</strong> {analysisData.architecture.deployment.platform}</li>
                            <li><strong>CI/CD:</strong> {analysisData.architecture.deployment.cicd}</li>
                            <li><strong>Monitoring:</strong> {analysisData.architecture.deployment.monitoring}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Metriche Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{analysisData.performance.metrics.bundleSize}</div>
                        <div className="text-sm text-muted-foreground">Bundle Size</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{analysisData.performance.metrics.loadTime}</div>
                        <div className="text-sm text-muted-foreground">Load Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{analysisData.performance.metrics.renderTime}</div>
                        <div className="text-sm text-muted-foreground">Render Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{analysisData.performance.metrics.apiResponseTime}</div>
                        <div className="text-sm text-muted-foreground">API Response</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Ottimizzazioni Applicate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisData.performance.optimizations.map((opt, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{opt}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Problemi Identificati
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisData.performance.issues.map((issue, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="scalability" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Carico Attuale</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{analysisData.scalability.currentLoad.users}</div>
                        <div className="text-sm text-muted-foreground">Utenti</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{analysisData.scalability.currentLoad.requests}</div>
                        <div className="text-sm text-muted-foreground">Richieste/giorno</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{analysisData.scalability.currentLoad.dataSize}</div>
                        <div className="text-sm text-muted-foreground">Dimensione Dati</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Bottlenecks Identificati</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisData.scalability.bottlenecks.map((bottleneck, index) => (
                          <li key={index} className="text-sm">{bottleneck}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Miglioramenti Raccomandati</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisData.scalability.improvements.map((improvement, index) => (
                          <li key={index} className="text-sm">{improvement}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Considerazioni Future</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisData.scalability.futureConsiderations.map((consideration, index) => (
                          <li key={index} className="text-sm">{consideration}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}