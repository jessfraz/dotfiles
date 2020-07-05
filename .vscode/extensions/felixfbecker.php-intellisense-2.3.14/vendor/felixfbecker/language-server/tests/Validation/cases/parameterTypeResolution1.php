<?php

class ParamType {
    public function setAccount(ParamType $account)
    {
        // If the passed account is already proxied, use the actual account instead
        // to prevent loops.
        if ($account instanceof static) {
            $account = $account->getAccount();
        }
    }
}
