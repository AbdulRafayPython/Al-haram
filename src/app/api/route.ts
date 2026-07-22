import { handle, ok, OPTIONS } from "@/lib/api/http";

export { OPTIONS };

/** GET /api — directory of endpoints, handy for a quick connectivity check. */
export const GET = handle(async () => {
  return ok({
    name: "Sasta Travel Express API",
    version: "1.0",
    auth: "POST /api/admin/login, then send 'Authorization: Bearer <accessToken>' on writes.",
    endpoints: {
      auth: ["POST /api/admin/login", "POST /api/admin/refresh", "GET /api/admin/me"],
      packages: [
        "GET /api/packages?status=published|all",
        "GET /api/packages/:id",
        "POST /api/packages/create (admin)",
        "POST /api/packages/update (admin)",
        "POST /api/packages/publish (admin)",
        "POST /api/packages/delete (admin)",
      ],
      hotels: [
        "GET /api/hotels",
        "POST /api/hotels/create (admin)",
        "POST /api/hotels/update (admin)",
        "POST /api/hotels/delete (admin)",
        "POST /api/hotels/image (admin, multipart)",
      ],
      airlines: [
        "GET /api/airlines",
        "POST /api/airlines/create (admin)",
        "POST /api/airlines/logo (admin, multipart)",
      ],
      cities: [
        "GET /api/cities",
        "POST /api/cities/create (admin)",
        "POST /api/cities/update (admin)",
        "POST /api/cities/delete (admin)",
      ],
      leads: ["GET /api/bookings (admin)", "GET /api/contacts (admin)"],
    },
  });
});
