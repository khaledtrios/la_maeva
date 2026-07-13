<?php

namespace App\Enums;

enum StoreValidationAction: string
{
    case Approved = 'APPROVED';
    case Rejected = 'REJECTED';
    case Suspended = 'SUSPENDED';
    case Reactivated = 'REACTIVATED';
}
