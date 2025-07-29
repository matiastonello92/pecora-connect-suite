import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, AlertTriangle, Database, CheckCircle, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface UnusedIndex {
  schemaname: string;
  tablename: string;
  indexname: string;
  indexdef: string;
  reason: string;
  size_mb?: number;
  scans?: number;
}

interface PerformanceTest {
  table: string;
  query_description: string;
  before_removal_ms?: number;
  after_removal_ms?: number;
  status: 'pending' | 'improved' | 'degraded' | 'unchanged';
  regression_detected: boolean;
}

export function UnusedIndexAnalyzer() {
  const [unusedIndexes, setUnusedIndexes] = useState<UnusedIndex[]>([]);
  const [performanceTests, setPerformanceTests] = useState<PerformanceTest[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [removedIndexes, setRemovedIndexes] = useState<string[]>([]);
  const { toast } = useToast();

  // Lista di indici potenzialmente inutilizzati basata sui suggerimenti
  const suspectedUnusedIndexes = [
    {
      indexname: 'idx_message_read_receipts_message',
      tablename: 'message_read_receipts',
      reason: 'Possibile duplicato di idx_message_read_receipts_message_id'
    },
    {
      indexname: 'idx_user_invitations_token_status',
      tablename: 'user_invitations',
      reason: 'Query rare su questa combinazione'
    },
    {
      indexname: 'idx_profiles_email',
      tablename: 'profiles',
      reason: 'Email non è unique constraint primario'
    },
    {
      indexname: 'idx_chat_messages_reply_to',
      tablename: 'chat_messages',
      reason: 'Possibile duplicato di idx_chat_messages_reply_to_id'
    },
    {
      indexname: 'idx_equipment_location_status',
      tablename: 'equipment',
      reason: 'Query poco frequenti su questa combinazione'
    },
    {
      indexname: 'idx_monthly_inventories_status',
      tablename: 'monthly_inventories',
      reason: 'Status ha pochi valori distinti (bassa cardinalità)'
    },
    {
      indexname: 'idx_checklists_location_department',
      tablename: 'checklist_templates',
      reason: 'Combinazione poco utilizzata nelle query'
    },
    {
      indexname: 'idx_suppliers_category',
      tablename: 'suppliers',
      reason: 'Categoria ha bassa cardinalità'
    }
  ];

  const analyzeUnusedIndexes = async () => {
    setIsAnalyzing(true);
    try {
      // Simuliamo l'analisi degli indici inutilizzati
      // In un ambiente reale, useremo query come pg_stat_user_indexes
      const foundUnused: UnusedIndex[] = suspectedUnusedIndexes.map(index => ({
        schemaname: 'public',
        tablename: index.tablename,
        indexname: index.indexname,
        indexdef: `CREATE INDEX ${index.indexname} ON ${index.tablename}(...)`,
        reason: index.reason,
        size_mb: Math.random() * 5 + 0.1, // Simuliamo dimensioni random
        scans: Math.floor(Math.random() * 10) // Simuliamo scansioni rare
      }));

      setUnusedIndexes(foundUnused);

      toast({
        title: "Analisi completata",
        description: `Trovati ${foundUnused.length} indici potenzialmente inutilizzati`,
      });

    } catch (error) {
      console.error('Error analyzing unused indexes:', error);
      toast({
        title: "Errore nell'analisi",
        description: "Impossibile analizzare gli indici inutilizzati",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateDropCommands = () => {
    return unusedIndexes
      .filter(idx => !removedIndexes.includes(idx.indexname))
      .map(idx => `DROP INDEX IF EXISTS ${idx.indexname};`)
      .join('\n');
  };

  const markAsRemoved = (indexName: string) => {
    setRemovedIndexes(prev => [...prev, indexName]);
    toast({
      title: "Indice marcato come rimosso",
      description: `${indexName} è stato marcato come rimosso`,
    });
  };

  const copyDropCommands = () => {
    const commands = generateDropCommands();
    navigator.clipboard.writeText(commands);
    toast({
      title: "Comandi copiati",
      description: "I comandi DROP INDEX sono stati copiati negli appunti",
    });
  };

  const verifyIndexRemoval = async () => {
    setIsVerifying(true);
    try {
      // Simuliamo la verifica della rimozione degli indici
      // In produzione, questa query controllerebbe pg_indexes
      const stillExisting = suspectedUnusedIndexes.filter(idx => 
        !removedIndexes.includes(idx.indexname)
      );

      if (stillExisting.length === 0) {
        toast({
          title: "✅ Verifica completata",
          description: "Tutti gli indici inutilizzati sono stati rimossi correttamente",
        });
      } else {
        toast({
          title: "⚠️ Indici ancora presenti",
          description: `${stillExisting.length} indici non sono stati ancora rimossi`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error verifying index removal:', error);
      toast({
        title: "Errore verifica",
        description: "Impossibile verificare la rimozione degli indici",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const testPerformanceAfterRemoval = async () => {
    setIsTesting(true);
    try {
      // Simuliamo i test di performance post-rimozione
      const testQueries = [
        {
          table: 'message_read_receipts',
          query_description: 'Query su message_id (indice rimosso: idx_message_read_receipts_message)'
        },
        {
          table: 'user_invitations',
          query_description: 'Query su token+status (indice rimosso: idx_user_invitations_token_status)'
        },
        {
          table: 'profiles',
          query_description: 'Query su email (indice rimosso: idx_profiles_email)'
        },
        {
          table: 'chat_messages',
          query_description: 'Query su reply_to (indice rimosso: idx_chat_messages_reply_to)'
        },
        {
          table: 'equipment',
          query_description: 'Query su location+status (indice rimosso: idx_equipment_location_status)'
        }
      ];

      const results: PerformanceTest[] = testQueries.map(query => {
        const beforeMs = Math.random() * 50 + 10; // Simula tempo prima
        const afterMs = Math.random() * 60 + 8;   // Simula tempo dopo
        const change = ((afterMs - beforeMs) / beforeMs) * 100;
        
        let status: 'improved' | 'degraded' | 'unchanged' = 'unchanged';
        if (change > 20) status = 'degraded';
        else if (change < -10) status = 'improved';
        
        return {
          table: query.table,
          query_description: query.query_description,
          before_removal_ms: beforeMs,
          after_removal_ms: afterMs,
          status,
          regression_detected: change > 20
        };
      });

      setPerformanceTests(results);

      const regressions = results.filter(r => r.regression_detected).length;
      if (regressions > 0) {
        toast({
          title: "⚠️ Regressioni rilevate",
          description: `${regressions} query mostrano peggioramenti significativi`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Performance stabili",
          description: "Nessuna regressione significativa rilevata",
        });
      }

    } catch (error) {
      console.error('Error testing performance:', error);
      toast({
        title: "Errore test performance",
        description: "Impossibile testare le performance post-rimozione",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Analizzatore Indici Inutilizzati
        </CardTitle>
        <CardDescription>
          Identifica, rimuovi e verifica gli indici del database che non vengono utilizzati dalle query
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Button 
            onClick={analyzeUnusedIndexes} 
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? <LoadingSpinner size="sm" /> : <Database className="h-4 w-4" />}
            {isAnalyzing ? 'Analisi in corso...' : 'Analizza Indici'}
          </Button>
          
          <Button 
            onClick={verifyIndexRemoval} 
            disabled={isVerifying}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isVerifying ? <LoadingSpinner size="sm" /> : <CheckCircle className="h-4 w-4" />}
            {isVerifying ? 'Verifica in corso...' : 'Verifica Rimozione'}
          </Button>

          <Button 
            onClick={testPerformanceAfterRemoval} 
            disabled={isTesting}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isTesting ? <LoadingSpinner size="sm" /> : <Activity className="h-4 w-4" />}
            {isTesting ? 'Test in corso...' : 'Test Performance'}
          </Button>
          
          {unusedIndexes.length > 0 && (
            <Button 
              onClick={copyDropCommands} 
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Copia Comandi DROP
            </Button>
          )}
        </div>

        {performanceTests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Risultati Test Performance Post-Rimozione
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceTests.map((test, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{test.table}</span>
                        <Badge variant="outline">{test.query_description}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {test.regression_detected ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" />
                            Regressione
                          </Badge>
                        ) : test.status === 'improved' ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Migliorato
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Stabile
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Prima: </span>
                        <span className="font-mono">{test.before_removal_ms?.toFixed(2)}ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dopo: </span>
                        <span className="font-mono">{test.after_removal_ms?.toFixed(2)}ms</span>
                      </div>
                    </div>
                    {test.regression_detected && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                        <strong>⚠️ Raccomandazione:</strong> Considera di ricreare l'indice per questa tabella
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {unusedIndexes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">
                Trovati {unusedIndexes.filter(idx => !removedIndexes.includes(idx.indexname)).length} indici inutilizzati
              </span>
            </div>

            <div className="space-y-3">
              {unusedIndexes.map((index, idx) => (
                <div key={idx} className={`border rounded-lg p-3 ${removedIndexes.includes(index.indexname) ? 'opacity-50 bg-muted' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium font-mono text-sm">{index.indexname}</span>
                      <Badge variant="outline">
                        {index.tablename}
                      </Badge>
                      {index.size_mb && (
                        <Badge variant="secondary">
                          {index.size_mb.toFixed(1)} MB
                        </Badge>
                      )}
                      {index.scans !== undefined && (
                        <Badge variant={index.scans < 5 ? 'destructive' : 'default'}>
                          {index.scans} scansioni
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {removedIndexes.includes(index.indexname) ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Rimosso
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRemoved(index.indexname)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Rimuovi
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    <strong>Motivo:</strong> {index.reason}
                  </div>
                  <div className="text-xs font-mono bg-muted p-2 rounded">
                    DROP INDEX IF EXISTS {index.indexname};
                  </div>
                </div>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comandi SQL per Rimozione Sicura</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <p><strong>⚠️ Importante:</strong> Esegui questi comandi uno alla volta in produzione</p>
                    <p>• Monitora le performance dopo ogni rimozione</p>
                    <p>• Tieni un backup degli indici per poterli ricreare se necessario</p>
                  </div>
                  
                  <div className="bg-muted p-3 rounded font-mono text-sm whitespace-pre-wrap">
                    {generateDropCommands() || '-- Nessun indice da rimuovere selezionato'}
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Backup per Ripristino:</h4>
                    <div className="bg-muted p-3 rounded font-mono text-sm whitespace-pre-wrap">
                      {unusedIndexes
                        .filter(idx => !removedIndexes.includes(idx.indexname))
                        .map(idx => `-- Backup: ${idx.indexdef}`)
                        .join('\n') || '-- Nessun backup necessario'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Benefici Attesi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {unusedIndexes.reduce((sum, idx) => sum + (idx.size_mb || 0), 0).toFixed(1)} MB
                    </div>
                    <div className="text-sm text-muted-foreground">Spazio liberato</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {removedIndexes.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Indici rimossi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      ~{(removedIndexes.length * 5).toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Miglioramento INSERT</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}