
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateUserSchema, type CreateUserFormData, UserRoleEnum } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface AddUserModalContentProps {
  onSubmitUser: (data: CreateUserFormData) => void;
  onClose: () => void;
}

export function AddUserModalContent({ onSubmitUser, onClose }: AddUserModalContentProps) {
  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'gestor', // Default role
    },
  });

  const handleSubmit: SubmitHandler<CreateUserFormData> = (data) => {
    onSubmitUser(data);
    // No need to call onClose here if onSubmitUser handles closing the modal
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol de Usuario</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {UserRoleEnum.options.map(roleValue => (
                    <SelectItem key={roleValue} value={roleValue}>
                      {roleValue.charAt(0).toUpperCase() + roleValue.slice(1)} {/* Capitalize role */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="pt-4 gap-3">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </DialogClose>
          <Button type="submit">Crear Usuario</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
