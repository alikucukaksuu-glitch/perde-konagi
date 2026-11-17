/**
 * Provider-neutral fulfillment contract.
 * Server-side ONLY. Never import into browser scripts.
 * These interfaces intentionally fail closed until each provider's official
 * API contract and test credentials have been supplied and verified.
 */
export type ProviderResult<T> =
 | {ok:true;value:T;providerRequestId?:string}
 | {ok:false;code:string;message:string;retryable:boolean};
export type InvoiceKind='e_fatura'|'e_arsiv';
export type InvoiceDraft={
 orderId:string;kind:InvoiceKind;currency:'TRY';
 buyer:{name:string;taxId?:string;taxOffice?:string;address:string};
 lines:Array<{name:string;quantity:number;unitGross:number;vatRate:number}>;
};
export type InvoiceReceipt={providerInvoiceId:string;invoiceNumber:string;issuedAt:string;documentUrl?:string};
export type ShipmentDraft={
 orderId:string;recipient:{name:string;phone:string;city:string;district:string;address:string;postalCode?:string};
 parcels:Array<{desi:number;weightKg?:number}>;
};
export type ShipmentReceipt={carrierShipmentId:string;trackingNumber:string;labelUrl?:string;trackingUrl?:string};
export interface InvoiceAdapter {
 verifyRecipient(taxId:string):Promise<ProviderResult<{kind:InvoiceKind}>>;
 issueInvoice(draft:InvoiceDraft,idempotencyKey:string):Promise<ProviderResult<InvoiceReceipt>>;
 getInvoice(providerInvoiceId:string):Promise<ProviderResult<InvoiceReceipt>>;
 cancelInvoice(providerInvoiceId:string,reason:string):Promise<ProviderResult<{cancelled:boolean}>>;
}
export interface ShippingAdapter {
 createShipment(draft:ShipmentDraft,idempotencyKey:string):Promise<ProviderResult<ShipmentReceipt>>;
 getShipment(carrierShipmentId:string):Promise<ProviderResult<{status:string;trackingNumber:string}>>;
 cancelShipment(carrierShipmentId:string):Promise<ProviderResult<{cancelled:boolean}>>;
}
const pending=(provider:string):ProviderResult<never>=>({ok:false,code:'PROVIDER_API_NOT_CONFIGURED',message:provider+' API sözleşmesi ve test kimlik bilgileri henüz doğrulanmadı.',retryable:false});
export class UnconfiguredInvoiceAdapter implements InvoiceAdapter{
 constructor(private readonly provider:string){}
 async verifyRecipient(_taxId:string){return pending(this.provider)}
 async issueInvoice(_draft:InvoiceDraft,_idempotencyKey:string){return pending(this.provider)}
 async getInvoice(_id:string){return pending(this.provider)}
 async cancelInvoice(_id:string,_reason:string){return pending(this.provider)}
}
export class UnconfiguredShippingAdapter implements ShippingAdapter{
 constructor(private readonly provider:string){}
 async createShipment(_draft:ShipmentDraft,_idempotencyKey:string){return pending(this.provider)}
 async getShipment(_id:string){return pending(this.provider)}
 async cancelShipment(_id:string){return pending(this.provider)}
}
