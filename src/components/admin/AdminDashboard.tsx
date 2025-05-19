
"use client";

import type { ExamInfo } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Eye, Edit3, Loader2 } from 'lucide-react'; // Added Loader2

interface AdminDashboardProps {
  savedExams: ExamInfo[];
  onAddNewUser: () => void;
  onViewExam: (exam: ExamInfo) => void;
  onEditExam: (exam: ExamInfo) => void; 
  isLoading?: boolean; // Added isLoading prop
}

export function AdminDashboard({ savedExams, onAddNewUser, onViewExam, onEditExam, isLoading }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-card custom-shadow">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <CardTitle className="text-xl md:text-2xl font-semibold text-card-foreground">Panel de Administración</CardTitle>
            <Button onClick={onAddNewUser}>
              <UserPlus className="mr-2 h-5 w-5" />
              Agregar Nuevo Usuario
            </Button>
          </div>
          <CardDescription>Gestionar usuarios y visualizar exámenes previos.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="bg-card custom-shadow">
        <CardHeader>
          <CardTitle>Exámenes Previos Guardados</CardTitle>
          <CardDescription>
            {isLoading ? "Cargando exámenes..." : 
              (savedExams.length > 0 
                ? "Lista de todos los exámenes previos registrados en el sistema." 
                : "No hay exámenes previos guardados. Los exámenes guardados por los gestores aparecerán aquí.")
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Cargando datos...</p>
            </div>
          ) : savedExams.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NE</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Gestor</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedExams.map((exam) => (
                    <TableRow key={exam.id || exam.ne}> {/* Use exam.id from Firestore */}
                      <TableCell className="font-medium">{exam.ne}</TableCell>
                      <TableCell>{exam.reference || 'N/A'}</TableCell>
                      <TableCell>{exam.manager}</TableCell>
                      <TableCell>{exam.location}</TableCell>
                       <TableCell>
                        {exam.createdAt ? new Date((exam.createdAt as any).seconds * 1000).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => onViewExam(exam)} title="Ver Examen">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onEditExam(exam)} title="Editar Examen">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          {/* Future: Delete button */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No hay exámenes para mostrar.
            </p>
          )}
        </CardContent>
         {!isLoading && savedExams.length > 0 && (
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Total de exámenes: {savedExams.length}
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
