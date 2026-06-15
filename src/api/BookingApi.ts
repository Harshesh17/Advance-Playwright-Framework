/**
 * src/api/BookingApi.ts
 * -----------------------------------------------------------------------------
 * Domain (service) class for the Restful Booker API, built on top of the shared
 * `ApiHelper`. It hides the endpoint paths, the `Cookie: token=` auth quirk and
 * the JSON parsing so specs read like plain English:
 *
 *   const api = new BookingApi(request);
 *   const token = await api.auth();
 *   const { bookingid } = await api.createBooking(payload);
 *   await api.updateBooking(bookingid, payload, token);
 *   await api.deleteBooking(bookingid, token);
 *
 * Mirrors the existing AuthApi / OrderApi / ProductApi pattern in this folder.
 *
 * Auth model (Restful Booker quirk):
 *   - GET / POST need NO auth.
 *   - PUT / PATCH / DELETE require the token as a Cookie header: `token=<token>`
 *     (NOT `Authorization: Bearer`).
 *   - DELETE returns 201 Created (not 200/204).
 */
import { APIResponse } from '@playwright/test';
import { ApiHelper, ApiContext } from '../utils/ApiHelper';

export interface BookingDates {
    checkin: string;
    checkout: string;
}

export interface Booking {
    firstname: string;
    lastname: string;
    totalprice: number;
    depositpaid: boolean;
    bookingdates: BookingDates;
    additionalneeds?: string;
}

/** POST /booking wraps the created booking with its new id. */
export interface CreateBookingResponse {
    bookingid: number;
    booking: Booking;
}

/** GET /booking returns an array of these id-only objects. */
export interface BookingId {
    bookingid: number;
}

export interface BookingFilters {
    firstname?: string;
    lastname?: string;
    checkin?: string;
    checkout?: string;
}

const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };

export class BookingApi {
    private apiHelper: ApiHelper;
    private baseUrl: string;

    constructor(context: ApiContext, baseUrl = 'https://restful-booker.herokuapp.com') {
        this.apiHelper = new ApiHelper(context);
        this.baseUrl = baseUrl;
    }

    /** Build the `Cookie: token=<token>` header Booker needs for writes. */
    private authHeaders(token: string): Record<string, string> {
        return { ...JSON_HEADERS, Cookie: `token=${token}` };
    }

    /**
     * POST /auth -> returns a token string. Throws if creds are rejected.
     * Defaults to the publicly-documented admin creds so a fresh clone works.
     */
    async auth(username = 'admin', password = 'password123'): Promise<string> {
        const response = await this.apiHelper.post(`${this.baseUrl}/auth`, { username, password }, {
            headers: JSON_HEADERS,
        });
        if (!this.apiHelper.isSuccess(response)) {
            throw new Error(`[BookingApi] POST /auth failed: ${response.status()}`);
        }
        const body = await this.apiHelper.parseJsonResponse<{ token?: string; reason?: string }>(response);
        if (!body.token) {
            throw new Error(`[BookingApi] /auth returned no token. Reason: ${body.reason ?? 'unknown'}`);
        }
        return body.token;
    }

    /** GET /booking -> list of booking ids, optionally filtered. */
    async getAllBookings(filters?: BookingFilters): Promise<BookingId[]> {
        const response = await this.apiHelper.get(`${this.baseUrl}/booking`, {
            params: filters as Record<string, string> | undefined,
        });
        if (!this.apiHelper.isSuccess(response)) {
            throw new Error(`[BookingApi] GET /booking failed: ${response.status()}`);
        }
        return this.apiHelper.parseJsonResponse<BookingId[]>(response);
    }

    /** GET /booking/{id} -> the parsed booking. Throws on non-2xx. */
    async getBooking(id: number): Promise<Booking> {
        const response = await this.getBookingResponse(id);
        if (!this.apiHelper.isSuccess(response)) {
            throw new Error(`[BookingApi] GET /booking/${id} failed: ${response.status()}`);
        }
        return this.apiHelper.parseJsonResponse<Booking>(response);
    }

    /** GET /booking/{id} -> raw response, so callers can assert status (e.g. 404). */
    async getBookingResponse(id: number): Promise<APIResponse> {
        return this.apiHelper.get(`${this.baseUrl}/booking/${id}`);
    }

    /** POST /booking -> { bookingid, booking }. No auth required. */
    async createBooking(payload: Booking): Promise<CreateBookingResponse> {
        const response = await this.apiHelper.post(`${this.baseUrl}/booking`, payload, {
            headers: JSON_HEADERS,
        });
        if (!this.apiHelper.isSuccess(response)) {
            throw new Error(`[BookingApi] POST /booking failed: ${response.status()}`);
        }
        return this.apiHelper.parseJsonResponse<CreateBookingResponse>(response);
    }

    /** PUT /booking/{id} -> full replace. Requires token. */
    async updateBooking(id: number, payload: Booking, token: string): Promise<Booking> {
        const response = await this.apiHelper.put(`${this.baseUrl}/booking/${id}`, payload, {
            headers: this.authHeaders(token),
        });
        if (!this.apiHelper.isSuccess(response)) {
            throw new Error(`[BookingApi] PUT /booking/${id} failed: ${response.status()}`);
        }
        return this.apiHelper.parseJsonResponse<Booking>(response);
    }

    /** PATCH /booking/{id} -> partial update. Requires token. */
    async patchBooking(id: number, partial: Partial<Booking>, token: string): Promise<Booking> {
        const response = await this.apiHelper.patch(`${this.baseUrl}/booking/${id}`, partial, {
            headers: this.authHeaders(token),
        });
        if (!this.apiHelper.isSuccess(response)) {
            throw new Error(`[BookingApi] PATCH /booking/${id} failed: ${response.status()}`);
        }
        return this.apiHelper.parseJsonResponse<Booking>(response);
    }

    /**
     * DELETE /booking/{id} -> returns the HTTP status (Booker uses 201 Created).
     * Requires token.
     */
    async deleteBooking(id: number, token: string): Promise<number> {
        const response = await this.apiHelper.delete(`${this.baseUrl}/booking/${id}`, {
            headers: this.authHeaders(token),
        });
        return response.status();
    }
}
