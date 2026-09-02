import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  addToCart,
  applyCartDiscount,
  checkout,
  closePosSession,
  getOpenSession,
  getOrCreateActiveCart,
  holdCart,
  listHeldCarts,
  openPosSession,
  resumeHeldCart,
  setCartTaxRate,
  updateCartItem,
} from '@/server/services/pos-service';

function posCtx(ctx: Awaited<ReturnType<typeof requireTenantContext>>) {
  if (!ctx.storeId || !ctx.branchId) throw new Error('VALIDATION_ERROR');
  return {
    organizationId: ctx.organizationId,
    storeId: ctx.storeId,
    branchId: ctx.branchId,
    userId: ctx.userId,
    currency: ctx.currency,
  };
}

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext('pos.read');
    const { searchParams } = new URL(request.url);
    const held = searchParams.get('held');

    if (held === 'true') {
      const carts = await listHeldCarts(posCtx(ctx));
      return Response.json({ carts });
    }

    const cart = await getOrCreateActiveCart(posCtx(ctx));
    const session = await getOpenSession(posCtx(ctx));
    return Response.json({ cart, session });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('pos.sell');
    const body = await request.json();
    const pctx = posCtx(ctx);

    if (body.action === 'add_item') {
      const data = z
        .object({ variantId: z.string().uuid(), quantity: z.number().int().positive().optional() })
        .parse(body);
      const cart = await addToCart(pctx, data);
      return Response.json({ cart });
    }

    if (body.action === 'update_item') {
      const data = z
        .object({ itemId: z.string().uuid(), quantity: z.number().int() })
        .parse(body);
      const cart = await updateCartItem(pctx, data.itemId, data.quantity);
      return Response.json({ cart });
    }

    if (body.action === 'discount') {
      const data = z
        .object({
          discountType: z.enum(['PERCENT', 'FIXED']),
          discountValue: z.number().int().positive(),
        })
        .parse(body);
      const cart = await applyCartDiscount(pctx, data);
      return Response.json({ cart });
    }

    if (body.action === 'tax') {
      const data = z.object({ taxRateBps: z.number().int().min(0) }).parse(body);
      const cart = await setCartTaxRate(pctx, data.taxRateBps);
      return Response.json({ cart });
    }

    if (body.action === 'hold') {
      const data = z.object({ cartId: z.string().uuid(), label: z.string().optional() }).parse(body);
      const cart = await holdCart(pctx, data.cartId, data.label);
      return Response.json({ cart });
    }

    if (body.action === 'resume') {
      const data = z.object({ cartId: z.string().uuid() }).parse(body);
      const cart = await resumeHeldCart(pctx, data.cartId);
      return Response.json({ cart });
    }

    if (body.action === 'set_customer') {
      const data = z
        .object({ cartId: z.string().uuid(), customerId: z.string().uuid().nullable() })
        .parse(body);
      const { attachCustomerToCart } = await import('@/server/services/customer-service');
      const cart = await attachCustomerToCart(
        ctx.organizationId,
        ctx.userId,
        data.cartId,
        data.customerId
      );
      return Response.json({
        cart: {
          id: cart.id,
          status: cart.status,
          currency: cart.currency,
          subtotalMinor: cart.subtotalMinor,
          discountAmount: cart.discountAmount,
          taxAmount: cart.taxAmount,
          totalMinor: cart.totalMinor,
          itemCount: cart.items.reduce((s, i) => s + i.quantity, 0),
          customer: cart.customer,
          items: cart.items,
        },
      });
    }

    if (body.action === 'complete') {
      const data = z
        .object({
          cartId: z.string().uuid(),
          idempotencyKey: z.string().max(128).optional(),
          paymentMethod: z.enum(['CASH', 'CARD', 'OTHER']),
          amountMinor: z.number().int().positive(),
          amountReceived: z.number().int().optional(),
          reference: z.string().optional(),
        })
        .parse(body);

      const order = await checkout(pctx, {
        cartId: data.cartId,
        idempotencyKey: data.idempotencyKey,
        payments: [
          {
            method: data.paymentMethod,
            amountMinor: data.amountMinor,
            amountReceived: data.amountReceived,
            reference: data.reference,
          },
        ],
      });
      return Response.json({ order });
    }

    return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    return handleApiError(err);
  }
}
