
"use client";

import type { FC } from 'react';
import { useState } from 'react';
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

const gestorAccountSchema = z.object({
  username: z.string().min(3, "Nombre de usuario debe tener al menos 3 caracteres."),
  password: z.string().min(6, "Clave debe tener al menos 6 caracteres.").optional(), // Optional during edit if not changing
  gestorName: z.string().min(1, "Nombre del Gestor es requerido."),
});

type GestorAccountFormData = z.infer<typeof gestorAccountSchema>;

interface GestorAccountFormProps {
  onSubmit: (data: GestorAccountFormData, accountId?: string) => void;
  initialData?: ManagedGestorAccount;
  existingUsernames: string[];
  isEditing?: boolean;
}

const GestorAccountForm: FC<GestorAccountFormProps> = ({ onSubmit, initialData, existingUsernames, isEditing }) => {
  const { control, handleSubmit, formState: { errors }, watch, reset } = useForm<GestorAccountFormData>({
    resolver: zodResolver(gestorAccountSchema.refine(data => {
        // Password is required if not editing, or if editing and password field is touched/filled
        if (!isEditing) return !!data.password;
        if (isEditing && data.password && data.password.length > 0) return data.password.length >= 6;
        return true; // If editing and password not touched, it's fine
    }, {
        message: "Clave es requerida y debe tener al menos 6 caracteres.",
        path: ["password"],
    }).refine(data => {
      // Username must be unique if not editing or if username changed during edit
      if (isEditing && initialData?.username === data.username) return true;
      return !existingUsernames.includes(data.username.toLowerCase());
    }, {
      message: "Este nombre de usuario ya existe.",
      path: ["username"],
    })),
    defaultValues: {
      username: initialData?.username || '',
      gestorName: initialData?.gestorName || '',
      password: '', // Always start password empty for security
    },
  });
  const [showPassword, setShowPassword] = useState(false);

  const submitHandler = (data: GestorAccountFormData) => {
    onSubmit(data, initialData?.id);
    reset(); // Reset form after submission
  };
  
  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4 p-1">
      <Controller
        name="username"
        control={control}
        render={({ field }) => (
          <div>
            <Label htmlFor="username">Nombre de Usuario</Label>
            <Input id="username" {...field} placeholder="e.g., jgestor" disabled={isEditing}/>
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
            <Input id="gestorName" {...field} placeholder="e.g., Juan Gestor Pérez" />
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
                <Input id="password" type={showPassword ? "text" : "password"} {...field} placeholder="Nueva clave" />
            )}
        />
        <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} aria-label="Mostrar/ocultar clave">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        </div>
        {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
      </div>
      <DialogFooter className="pt-4">
        <DialogClose asChild>
            <Button type="button" variant="outline"> <X className="mr-2 h-4 w-4" />Cancelar</Button>
        </DialogClose>
        <Button type="submit">
          <Save className="mr-2 h-4 w-4" />
          {isEditing ? 'Actualizar Cuenta' : 'Crear Cuenta'}
        </Button>
      </DialogFooter>
    </form>
  );
};


interface ManageGestoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: ManagedGestorAccount[];
  onSaveAccounts: (accounts: ManagedGestorAccount[]) => void;
}

export const ManageGestoresModal: FC<ManageGestoresModalProps> = ({ isOpen, onClose, accounts, onSaveAccounts }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ManagedGestorAccount | null>(null);
  const { toast } = useToast();

  const handleAddOrUpdateAccount = (data: GestorAccountFormData, accountId?: string) => {
    let updatedAccounts;
    if (accountId) { // Editing
      updatedAccounts = accounts.map(acc =>
        acc.id === accountId ? { ...acc, username: data.username, gestorName: data.gestorName, password: data.password || acc.password } : acc
      );
      toast({ title: "Cuenta Actualizada", description: `La cuenta para ${data.username} ha sido actualizada.` });
    } else { // Adding new
      const newAccount: ManagedGestorAccount = {
        id: crypto.randomUUID(),
        username: data.username,
        password: data.password!, // Password is required for new accounts by schema
        gestorName: data.gestorName,
      };
      updatedAccounts = [...accounts, newAccount];
      toast({ title: "Cuenta Creada", description: `La cuenta para ${data.username} ha sido creada.` });
    }
    onSaveAccounts(updatedAccounts);
    setShowForm(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = (accountId: string) => {
    const accountToDelete = accounts.find(acc => acc.id === accountId);
    if (window.confirm(`¿Está seguro que desea eliminar la cuenta de ${accountToDelete?.username}? Esta acción no se puede deshacer.`)) {
        const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
        onSaveAccounts(updatedAccounts);
        toast({ title: "Cuenta Eliminada", description: `La cuenta ha sido eliminada.`, variant: "destructive" });
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

  const existingUsernames = accounts.map(acc => acc.username.toLowerCase());

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingAccount(null); onClose(); } }}>
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
            initialData={editingAccount || undefined}
            existingUsernames={existingUsernames.filter(u => u !== editingAccount?.username.toLowerCase())}
            isEditing={!!editingAccount}
          />
        ) : (
          <>
            <div className="py-2">
              <Button onClick={handleShowAddForm} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nueva Cuenta
              </Button>
            </div>
            <ScrollArea className="flex-grow min-h-0 pr-1">
              {accounts.length === 0 ? (
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
                        <Button variant="ghost" size="icon" onClick={() => handleEditAccount(account)}>
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(account.id)}>
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
              <Button type="button" variant="outline" onClick={() => {setShowForm(false); setEditingAccount(null); onClose();}}>
                <X className="mr-2 h-4 w-4" /> Cerrar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
