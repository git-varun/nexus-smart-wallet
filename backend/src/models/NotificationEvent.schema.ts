import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationEvent extends Document {
    userId: string;
    eventId: string;
    type: string;
    payload: any;
    timestamp: Date;
}

const NotificationEventSchema = new Schema<INotificationEvent>({
    userId: { type: String, required: true },
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    timestamp: { type: Date, default: Date.now }
});

// TTL index: expire events after 24 hours
NotificationEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });
NotificationEventSchema.index({ userId: 1, timestamp: 1 });

export const NotificationEventModel = mongoose.model<INotificationEvent>('NotificationEvent', NotificationEventSchema);
