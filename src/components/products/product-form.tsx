"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product, ProductFormData } from "@/lib/types";
import { useState } from "react";

const packagingConditions: Product["packagingCondition"][] = ["New", "Used", "Damaged", "Good", "Fair", "Poor", "Other"];

const formSchema = z.object({
  itemNumber: z.string().min(1, "Item number is required"),
  name: z.string().min(1, "Product name/description is required"),
  reference: z.string().optional(),
  location: z.string().optional(),
  brand: z.string().optional(),
  quantity: z.coerce.number().min(0, "Quantity must be non-negative"),
  packagingCondition: z.enum(packagingConditions).optional(),
});

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemNumber: product?.itemNumber || "",
      name: product?.name || "",
      reference: product?.reference || "",
      location: product?.location || "",
      brand: product?.brand || "",
      quantity: product?.quantity || 0,
      packagingCondition: product?.packagingCondition || undefined,
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="itemNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Number / ID</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., SKU12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Name / Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detailed product name or description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Input placeholder="Product brand" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference</FormLabel>
                <FormControl>
                  <Input placeholder="Internal reference code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Shelf A1, Bin 2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="packagingCondition"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Packaging Condition</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select packaging condition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {packagingConditions.map((condition) => (
                      <SelectItem key={condition} value={condition!}> {/* Add non-null assertion for key */}
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : (product ? "Save Changes" : "Add Product")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
