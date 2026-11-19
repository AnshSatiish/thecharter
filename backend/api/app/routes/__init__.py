"""HTTP layer only: validate the request, call a service, return the response.

public/  Open to everyone (the map, search, author pages).
admin/   Every route behind require_admin, applied once on the admin router.
"""
