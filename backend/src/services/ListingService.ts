import { PrismaClient } from '@prisma/client';
import { PageLimitParams, toSkipTake } from '../utils/pagination';

const prisma = new PrismaClient();

export class ListingService {
  /**
   * Toggle the visibility of a listing
   * @param listingId ID of the listing
   * @param mentorId ID of the mentor (for authorization)
   * @param isActive Desired state
   */
  async toggleVisibility(listingId: string, mentorId: string, isActive: boolean) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    
    if (!listing) {
      throw new Error('Listing not found');
    }
    
    // Ensure only the mentor who owns the listing can toggle it
    if (listing.mentorId !== mentorId) {
      throw new Error('Unauthorized: You can only toggle your own listings');
    }

    return prisma.listing.update({
      where: { id: listingId },
      data: { isActive }
    });
  }

  /**
   * Search listings, excluding hidden ones
   * @param query Search string
   * @param params Page/limit pagination params
   */
  async searchListings(query: string = '', params: PageLimitParams): Promise<{ data: any[]; total: number }> {
    const q = query.trim();
    const where = {
      isActive: true,
      ...(q ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' as const } },
          { description: { contains: q, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const [total, data] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({ where, ...toSkipTake(params) }),
    ]);

    return { data, total };
  }
}

export const listingService = new ListingService();
