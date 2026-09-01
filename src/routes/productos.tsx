import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import {
  EmptyState,
  Field,
  FormModal,
  LoadingState,
  inputClass,
  submitClass,
  textareaClass,
} from "@/components/form-modal";
import {
  deleteProductImage,
  getProductImageUrl,
  listPricingTiers,
  listProducts,
  savePricingTier,
  saveProduct,
  saveVariant,
  uploadProductImages,
  type ProductImageRow,
  type ProductRow,
  type ProductVariantRow,
  type PricingTierRow,
} from "@/lib/data-service";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/lib/organization";
import { canManageCatalog, isValidRingSize, isValidWeightRange } from "@/lib/business-rules";
export const Route = createFileRoute("/productos")({
  head: () => ({ meta: [{ title: "Catálogo — ZOLMYRA AI OS" }] }),
  component: Productos,
});
const productSchema = z.object({
  name: z.string().trim().min(2),
  code: z.string().trim().min(2),
  category: z.string().trim().min(2),
  description: z.string().optional(),
  active: z.boolean(),
});
type ProductValues = z.infer<typeof productSchema>;
const variantSchema = z
  .object({
    name: z.string().trim().min(2),
    code: z.string().trim().min(2),
    material: z.enum(["gold", "silver"]),
    size: z.coerce
      .number()
      .min(4)
      .max(13)
      .refine(isValidRingSize, "Solo tallas del 4 al 13, enteras o medias."),
    minWeight: z.coerce.number().positive(),
    maxWeight: z.coerce.number().positive(),
    basePrice: z.coerce.number().min(0),
    indicativePrice: z.coerce.number().min(0),
  })
  .refine((value) => isValidWeightRange(value.minWeight, value.maxWeight), {
    path: ["maxWeight"],
    message: "Debe ser igual o mayor al peso mínimo.",
  });
type VariantValues = z.infer<typeof variantSchema>;
const pricingSchema = z
  .object({
    name: z.string().trim().min(2),
    minWeight: z.coerce.number().positive(),
    maxWeight: z.coerce.number().positive(),
    indicativePrice: z.coerce.number().min(0),
  })
  .refine((value) => isValidWeightRange(value.minWeight, value.maxWeight), {
    path: ["maxWeight"],
    message: "Rango de peso inválido.",
  });
type PricingValues = z.infer<typeof pricingSchema>;
function Productos() {
  const { user } = useAuth();
  const { current } = useOrganization();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [variants, setVariants] = useState<ProductVariantRow[]>([]);
  const [images, setImages] = useState<ProductImageRow[]>([]);
  const [tiers, setTiers] = useState<PricingTierRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [productOpen, setProductOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<ProductRow | null>(null);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [tierEditing, setTierEditing] = useState<PricingTierRow | null>(null);
  const [tierOpen, setTierOpen] = useState(false);
  const canManage = canManageCatalog(current.roleCode);
  const productForm = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      code: "",
      category: "Anillo de graduación",
      description: "",
      active: true,
    },
  });
  const variantForm = useForm<VariantValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      name: "",
      code: "",
      material: "gold",
      size: 7,
      minWeight: 5.1,
      maxWeight: 5.6,
      basePrice: 0,
      indicativePrice: 0,
    },
  });
  const pricingForm = useForm<PricingValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: { name: "", minWeight: 5.1, maxWeight: 5.6, indicativePrice: 0 },
  });
  const load = async () => {
    if (!current.id) return;
    setLoading(true);
    try {
      const [data, priceData] = await Promise.all([
        listProducts(current.id),
        listPricingTiers(current.id),
      ]);
      setProducts(data.products);
      setVariants(data.variants);
      setImages(data.images);
      setTiers(priceData);
      const entries = await Promise.all(
        data.images.map(
          async (image) => [image.id, await getProductImageUrl(image.storage_path)] as const,
        ),
      );
      setUrls(
        Object.fromEntries(
          entries.filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
        ),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible cargar el catálogo.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [current.id]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("create") === "product") startProduct();
  }, []);
  function startProduct(item?: ProductRow) {
    setEditing(item ?? null);
    productForm.reset(
      item
        ? {
            name: item.name,
            code: item.code,
            category: item.category,
            description: item.description ?? "",
            active: item.active,
          }
        : { name: "", code: "", category: "Anillo de graduación", description: "", active: true },
    );
    setProductOpen(true);
  }
  async function submitProduct(values: ProductValues) {
    if (!user) return;
    try {
      await saveProduct(current.id, user.id, { id: editing?.id, ...values });
      toast.success(editing ? "Producto actualizado." : "Producto creado.");
      setProductOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible guardar el producto.");
    }
  }
  async function submitVariant(values: VariantValues) {
    if (!user || !variantProduct) return;
    try {
      await saveVariant(current.id, user.id, { productId: variantProduct.id, ...values });
      toast.success("Variante creada.");
      setVariantProduct(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible guardar la variante.");
    }
  }
  async function upload(product: ProductRow, files: FileList | null) {
    if (!user || !files?.length) return;
    try {
      await uploadProductImages(current.id, user.id, product.id, Array.from(files));
      toast.success("Imágenes cargadas.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible cargar las imágenes.");
    }
  }
  function openTier(item?: PricingTierRow) {
    setTierEditing(item ?? null);
    pricingForm.reset(
      item
        ? {
            name: item.name,
            minWeight: Number(item.min_weight),
            maxWeight: Number(item.max_weight),
            indicativePrice: Number(item.indicative_price),
          }
        : { name: "", minWeight: 5.1, maxWeight: 5.6, indicativePrice: 0 },
    );
    setTierOpen(true);
  }
  async function submitTier(values: PricingValues) {
    if (!user) return;
    try {
      await savePricingTier(current.id, user.id, { id: tierEditing?.id, ...values });
      toast.success("Rango de precio guardado.");
      setTierOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible guardar el precio.");
    }
  }
  return (
    <AppShell
      title="Catálogo de productos"
      subtitle={`Productos y variantes de ${current.name}`}
      actions={
        <button disabled={!canManage} onClick={() => startProduct()} className={submitClass}>
          <Plus className="mr-2 size-4" />
          Nuevo producto
        </button>
      }
    >
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
        El precio final puede variar según los gramos reales correspondientes a la medida del
        anillo.
      </div>
      <section className="panel p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Rangos de precios</h2>
            <p className="text-xs text-muted-foreground">
              Configuración exclusiva de {current.name}; no está escrita permanentemente en el
              frontend.
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => openTier()}
              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold"
            >
              <Plus className="mr-1 inline size-4" />
              Agregar rango
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {tiers.map((tier) => (
            <button
              onClick={() => canManage && openTier(tier)}
              className="rounded-xl border border-border p-4 text-left"
              key={tier.id}
            >
              <p className="font-semibold">{tier.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {tier.min_weight}–{tier.max_weight} g
              </p>
              <p className="mt-2 text-lg font-bold">
                RD${Number(tier.indicative_price).toLocaleString("es-DO")}
              </p>
            </button>
          ))}
          {tiers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Esta empresa aún no ha configurado rangos.
            </p>
          )}
        </div>
      </section>
      {loading ? (
        <LoadingState />
      ) : products.length === 0 ? (
        <EmptyState
          title="Catálogo vacío"
          detail="Crea productos y luego agrega variantes con talla, material, peso y precio guardados en Supabase."
          action={
            canManage ? (
              <button onClick={() => startProduct()} className={submitClass}>
                Crear producto
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {products.map((product) => {
            const productVariants = variants.filter((item) => item.product_id === product.id);
            const productImages = images.filter((item) => item.product_id === product.id);
            return (
              <article className="panel overflow-hidden" key={product.id}>
                <div className="grid grid-cols-3 gap-1 bg-muted">
                  {productImages.slice(0, 3).map((image) => (
                    <div className="group relative aspect-video" key={image.id}>
                      {urls[image.id] ? (
                        <img
                          src={urls[image.id]}
                          alt={image.alt_text ?? product.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full bg-muted" />
                      )}
                      {canManage && (
                        <button
                          onClick={() =>
                            void (async () => {
                              await deleteProductImage(image);
                              await load();
                            })()
                          }
                          className="absolute right-1 top-1 hidden rounded bg-background/80 p-1 group-hover:block"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase text-primary">
                        {product.category} · {product.code}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold">{product.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {product.description || "Sin descripción"}
                      </p>
                    </div>
                    {canManage && (
                      <button onClick={() => startProduct(product)}>
                        <Pencil className="size-4" />
                      </button>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    {productVariants.map((variant) => (
                      <div
                        className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-border p-3"
                        key={variant.id}
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {variant.name} · Talla {variant.size}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {variant.material === "gold" ? "Oro" : "Plata"} · {variant.min_weight}–
                            {variant.max_weight} g
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          RD${Number(variant.indicative_price).toLocaleString("es-DO")}
                        </p>
                      </div>
                    ))}
                  </div>
                  {canManage && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setVariantProduct(product);
                          variantForm.reset();
                        }}
                        className="rounded-lg border border-border px-3 py-2 text-xs font-semibold"
                      >
                        <Plus className="mr-1 inline size-4" />
                        Variante
                      </button>
                      <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-xs font-semibold">
                        <ImagePlus className="mr-1 inline size-4" />
                        Imágenes
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          className="hidden"
                          onChange={(event) => void upload(product, event.target.files)}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <FormModal
        open={productOpen}
        title={editing ? "Editar producto" : "Nuevo producto"}
        onClose={() => setProductOpen(false)}
      >
        <form
          onSubmit={productForm.handleSubmit(submitProduct)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Nombre" error={productForm.formState.errors.name?.message}>
            <input {...productForm.register("name")} className={inputClass} />
          </Field>
          <Field label="Código">
            <input {...productForm.register("code")} className={inputClass} />
          </Field>
          <Field label="Categoría">
            <select {...productForm.register("category")} className={inputClass}>
              <option>Anillo de graduación</option>
              <option>Anillo matrimonial</option>
              <option>Otro</option>
            </select>
          </Field>
          <Field label="Estado">
            <label className="flex h-11 items-center gap-2">
              <input type="checkbox" {...productForm.register("active")} />
              Producto activo
            </label>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descripción">
              <textarea {...productForm.register("description")} className={textareaClass} />
            </Field>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button disabled={productForm.formState.isSubmitting} className={submitClass}>
              Guardar producto
            </button>
          </div>
        </form>
      </FormModal>
      <FormModal
        open={tierOpen}
        title={tierEditing ? "Editar rango de precio" : "Nuevo rango de precio"}
        onClose={() => setTierOpen(false)}
      >
        <form onSubmit={pricingForm.handleSubmit(submitTier)} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre">
            <input {...pricingForm.register("name")} className={inputClass} />
          </Field>
          <Field label="Precio orientativo">
            <input
              {...pricingForm.register("indicativePrice")}
              type="number"
              min="0"
              className={inputClass}
            />
          </Field>
          <Field label="Peso mínimo">
            <input
              {...pricingForm.register("minWeight")}
              type="number"
              min="0"
              step="0.1"
              className={inputClass}
            />
          </Field>
          <Field label="Peso máximo" error={pricingForm.formState.errors.maxWeight?.message}>
            <input
              {...pricingForm.register("maxWeight")}
              type="number"
              min="0"
              step="0.1"
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2 flex justify-end">
            <button disabled={pricingForm.formState.isSubmitting} className={submitClass}>
              Guardar rango
            </button>
          </div>
        </form>
      </FormModal>
      <FormModal
        open={Boolean(variantProduct)}
        title={`Nueva variante · ${variantProduct?.name ?? ""}`}
        onClose={() => setVariantProduct(null)}
      >
        <form
          onSubmit={variantForm.handleSubmit(submitVariant)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Modelo">
            <input {...variantForm.register("name")} className={inputClass} />
          </Field>
          <Field label="Código">
            <input {...variantForm.register("code")} className={inputClass} />
          </Field>
          <Field label="Material">
            <select {...variantForm.register("material")} className={inputClass}>
              <option value="gold">Oro</option>
              <option value="silver">Plata</option>
            </select>
          </Field>
          <Field label="Talla" error={variantForm.formState.errors.size?.message}>
            <input
              {...variantForm.register("size")}
              type="number"
              min="4"
              max="13"
              step="0.5"
              className={inputClass}
            />
          </Field>
          <Field label="Peso mínimo">
            <input
              {...variantForm.register("minWeight")}
              type="number"
              min="0"
              step="0.1"
              className={inputClass}
            />
          </Field>
          <Field label="Peso máximo" error={variantForm.formState.errors.maxWeight?.message}>
            <input
              {...variantForm.register("maxWeight")}
              type="number"
              min="0"
              step="0.1"
              className={inputClass}
            />
          </Field>
          <Field label="Precio base">
            <input
              {...variantForm.register("basePrice")}
              type="number"
              min="0"
              className={inputClass}
            />
          </Field>
          <Field label="Precio orientativo">
            <input
              {...variantForm.register("indicativePrice")}
              type="number"
              min="0"
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2 flex justify-end">
            <button disabled={variantForm.formState.isSubmitting} className={submitClass}>
              Guardar variante
            </button>
          </div>
        </form>
      </FormModal>
    </AppShell>
  );
}
