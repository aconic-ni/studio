
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ManagedGestorAccount } from '@/types';
import { Users, PlusCircle, Edit, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, getDocs, writeBatch } from 'firebase/firestore';

const gestorAccountSchema = z.object({
  username: z.string().min(3, "Nombre de usuario debe tener al menos 3 caracteres.").toLowerCase(),
  password: z.string().min(6, "Clave debe tener al menos 6 caracteres.").optional(), 
  gestorName: z.string().min(1, "Nombre del Gestor es requerido."),
});

type GestorAccountFormData = z.infer<typeof gestorAccountSchema>;

interface GestorAccountFormProps {
  onSubmit: (data: GestorAccountFormData, accountId?: string) => Promise<void>; // Made async
  onCancel: () => void; // Added for closing form
  initialData?: ManagedGestorAccount;
  existingUsernames: string[];
  isEditing?: boolean;
  isSaving: boolean; // To disable button during save
}

const GestorAccountForm: FC<GestorAccountFormProps> = ({ onSubmit, onCancel, initialData, existingUsernames, isEditing, isSaving }) => {
  const { control, handleSubmit, formState: { errors }, watch, reset } = useForm<GestorAccountFormData>({
    resolver: zodResolver(gestorAccountSchema.refine(data => {
        if (!isEditing) return !!data.password && data.password.length >= 6;
        if (isEditing && data.password && data.password.length > 0) return data.password.length >= 6;
        return true; 
    }, {
        message: "Clave es requerida y debe tener al menos 6 caracteres.",
        path: ["password"],
    }).refine(data => {
      const currentUsername = data.username.toLowerCase();
      if (isEditing && initialData?.username.toLowerCase() === currentUsername) return true;
      return !existingUsernames.includes(currentUsername);
    }, {
      message: "Este nombre de usuario ya existe.",
      path: ["username"],
    })),
    defaultValues: {
      username: initialData?.username || '',
      gestorName: initialData?.gestorName || '',
      password: '', 
    },
  });
  const [showPassword, setShowPassword] = useState(false);

  const submitHandler = async (data: GestorAccountFormData) => {
    await onSubmit(data, initialData?.id);
    // Reset is handled by modal re-render or explicit call
  };
  
  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4 p-1">
      <Controller
        name="username"
        control={control}
        render={({ field }) => (
          <div>
            <Label htmlFor="username">Nombre de Usuario</Label>
            <Input id="username" {...field} placeholder="e.g., jgestor" disabled={isEditing || isSaving}/>
            {errors.username && <p className="text-xs text-destructive mt-1">{errors.username.message}</p>}
          </div>
        )}
      />
      <Controller
        name="gestorName"
        control={control}
        render={({ field }) => (
          <div>
            <Label htmlFor="gestorName">Nombre Completo del Gestor</Label>
            <Input id="gestorName" {...field} placeholder="e.g., Juan Gestor Pérez" disabled={isSaving} />
            {errors.gestorName && <p className="text-xs text-destructive mt-1">{errors.gestorName.message}</p>}
          </div>
        )}
      />
       <div>
        <Label htmlFor="password">Clave {isEditing && "(Dejar vacío para no cambiar)"}</Label>
        <div className="flex items-center gap-2">
        <Controller
            name="password"
            control={control}
            render={({ field }) => (
                <Input id="password" type={showPassword ? "text" : "password"} {...field} placeholder="Nueva clave" disabled={isSaving} />
            )}
        />
        <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} disabled={isSaving} aria-label="Mostrar/ocultar clave">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        </div>
        {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
      </div>
      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}> <X className="mr-2 h-4 w-4" />Cancelar</Button>
        <Button type="submit" disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ? 'Actualizar Cuenta' : 'Crear Cuenta')}
        </Button>
      </DialogFooter>
    </form>
  );
};


interface ManageGestoresModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageGestoresModal: FC<ManageGestoresModalProps> = ({ isOpen, onClose }) => {
  const [accounts, setAccounts] = useState<ManagedGestorAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ManagedGestorAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firebaseConfigured = db !== null;

  useEffect(() => {
    if (!isOpen || !firebaseConfigured) {
      setAccounts([]); 
      return;
    }
    setIsLoading(true);
    const gestorAccountsRef = collection(db, "gestorAccounts");
    const unsubscribe = onSnapshot(gestorAccountsRef, (snapshot) => {
      const fetchedAccounts: ManagedGestorAccount[] = [];
      snapshot.forEach(doc => {
        fetchedAccounts.push({ id: doc.id, ...doc.data() } as ManagedGestorAccount);
      });
      setAccounts(fetchedAccounts.sort((a, b) => a.username.localeCompare(b.username))); // Sort alphabetically
      setIsLoading(false);
    }, (error: any) => {
      console.error("Error fetching gestor accounts:", error);
      toast({ title: "Error de Carga", description: `No se pudieron cargar las cuentas de gestores. Código: ${error.code || 'N/A'}.`, variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, firebaseConfigured, toast]);

  const handleAddOrUpdateAccount = async (data: GestorAccountFormData, accountId?: string) => {
    if (!firebaseConfigured) {
      toast({ title: "Error de Configuración", description: "Firebase no está configurado.", variant: "destructive"});
      return;
    }
    setIsSaving(true);
    try {
      if (accountId) { 
        const accountRef = doc(db, "gestorAccounts", accountId);
        const accountToUpdate: Partial<Omit<ManagedGestorAccount, 'id' | 'username'>> & { username?: string } = { 
            gestorName: data.gestorName 
        };
        if (data.password) { 
            accountToUpdate.password = data.password;
        }
        // Username is not updated after creation to keep it simple
        // accountToUpdate.username = data.username.toLowerCase(); 
        console.log("Attempting to update gestor account. ID:", accountId, "Data:", JSON.stringify(accountToUpdate, null, 2));
        await updateDoc(accountRef, accountToUpdate);
        console.log("Gestor account updated successfully, ID:", accountId);
        toast({ title: "Cuenta Actualizada", description: `La cuenta para ${data.username} ha sido actualizada.` });
      } else { 
        const newAccountData: Omit<ManagedGestorAccount, 'id'> = {
          username: data.username.toLowerCase(),
          password: data.password!, 
          gestorName: data.gestorName,
        };
        console.log("Attempting to add new gestor account. Data:", JSON.stringify(newAccountData, null, 2));
        const docRef = await addDoc(collection(db, "gestorAccounts"), newAccountData);
        console.log("Gestor account added successfully, new ID:", docRef.id);
        toast({ title: "Cuenta Creada", description: `La cuenta para ${data.username} ha sido creada.` });
      }
      setShowForm(false);
      setEditingAccount(null);
    } catch (error: any) {
      console.error("Firestore save/update error in handleAddOrUpdateAccount:", error);
      console.error("Error name:", error.name);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      toast({ title: "Error al Guardar", description: `No se pudo guardar la cuenta del gestor. Código: ${error.code || 'N/A'}.`, variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!firebaseConfigured) {
      toast({ title: "Error de Configuración", description: "Firebase no está configurado.", variant: "destructive"});
      return;
    }
    const accountToDelete = accounts.find(acc => acc.id === accountId);
    if (window.confirm(`¿Está seguro que desea eliminar la cuenta de ${accountToDelete?.username}? Esta acción no se puede deshacer.`)) {
        try {
            console.log("Attempting to delete gestor account, ID:", accountId);
            await deleteDoc(doc(db, "gestorAccounts", accountId));
            console.log("Gestor account deleted successfully, ID:", accountId);
            toast({ title: "Cuenta Eliminada", description: `La cuenta ha sido eliminada.`, variant: "destructive" });
        } catch (error: any) {
            console.error("Error deleting gestor account:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            toast({ title: "Error al Eliminar", description: `No se pudo eliminar la cuenta. Código: ${error.code || 'N/A'}.`, variant: "destructive"});
        }
    }
  };

  const handleEditAccount = (account: ManagedGestorAccount) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleShowAddForm = () => {
    setEditingAccount(null);
    setShowForm(true);
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAccount(null);
  }

  const existingUsernames = accounts.map(acc => acc.username.toLowerCase());

  const handleCloseModal = () => {
    if (isSaving) return; 
    setShowForm(false);
    setEditingAccount(null);
    onClose();
  }

  if (!firebaseConfigured && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error de Configuración</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Firebase no está configurado. La gestión de cuentas de gestores no está disponible.
            Por favor, configure Firebase en <code className="bg-muted text-muted-foreground px-1 rounded-sm">src/lib/firebase.ts</code>.
          </DialogDescription>
          <DialogFooter>
            <Button onClick={handleCloseModal}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[750px] lg:max-w-[800px] flex flex-col max-h-[90vh] text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Users className="w-5 h-5 text-foreground" />
            Gestionar Cuentas de Gestores Aduaneros
          </DialogTitle>
          {!showForm && <DialogDescription>Añada, edite o elimine cuentas para los Gestores Aduaneros.</DialogDescription>}
        </DialogHeader>

        {showForm ? (
          <GestorAccountForm
            key={editingAccount ? editingAccount.id : 'new'}
            onSubmit={handleAddOrUpdateAccount}
            onCancel={handleCloseForm}
            initialData={editingAccount || undefined}
            existingUsernames={existingUsernames.filter(u => u !== editingAccount?.username.toLowerCase())}
            isEditing={!!editingAccount}
            isSaving={isSaving}
          />
        ) : (
          <>
            <div className="py-2">
              <Button onClick={handleShowAddForm} size="sm" disabled={isLoading || isSaving}>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nueva Cuenta
              </Button>
            </div>
            <ScrollArea className="flex-grow min-h-0 pr-1">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Cargando cuentas...</p>
              ) : accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No hay cuentas de gestores configuradas.</p>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre de Usuario</TableHead>
                    <TableHead>Nombre del Gestor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.username}</TableCell>
                      <TableCell>{account.gestorName}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditAccount(account)} disabled={isSaving}>
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(account.id)} disabled={isSaving}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" /> Cerrar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

    
