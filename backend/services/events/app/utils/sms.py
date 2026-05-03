"""
SMS utility — sends text messages via AWS SNS direct publish.
Used for announcements. Reminders are handled by EventBridge Scheduler.
"""
import logging
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)
_sns = boto3.client("sns")


def send_sms(phone_number: str, message: str) -> bool:
    """
    Send an SMS to a single E.164 phone number.
    Returns True on success, False on failure (non-fatal).
    """
    try:
        _sns.publish(
            PhoneNumber=phone_number,
            Message=message,
            MessageAttributes={
                "AWS.SNS.SMS.SMSType": {
                    "DataType": "String",
                    "StringValue": "Transactional",
                }
            },
        )
        return True
    except ClientError as e:
        logger.warning("Failed to send SMS to %s: %s", phone_number, e)
        return False
