<?php

namespace MyNamespace;

class ParseErrorsTest
{
    public function setAccount(AccountInterface $account)
    {
        // If the passed account is already proxied, use the actual account instead
        // to prevent loops.
        if ($account instanceof A) {
            $account = $account->getAccount();
        }

    }
}