-- Script di verifica per le ottimizzazioni RLS
-- Questo script verifica che tutte le policy siano state ottimizzate correttamente

-- 1. Controllo generale delle policy ottimizzate
SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%( SELECT auth.uid()%' OR with_check LIKE '%( SELECT auth.uid()%' THEN 'OPTIMIZED'
        WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN 'NEEDS_OPTIMIZATION'
        ELSE 'NO_AUTH_FUNCTION'
    END as optimization_status,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND (qual LIKE '%auth.%' OR with_check LIKE '%auth.%')
ORDER BY optimization_status DESC, tablename, policyname;

-- 2. Test di performance su query principali
\echo '=== Performance Test: Profiles Query ==='
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM profiles WHERE user_id = (select auth.uid());

\echo '=== Performance Test: Chat Messages Query ==='
EXPLAIN (ANALYZE, BUFFERS)
SELECT cm.* FROM chat_messages cm
WHERE EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.chat_id = cm.chat_id 
    AND cp.user_id = (select auth.uid())
) LIMIT 10;

-- 3. Test dei controlli di accesso
\echo '=== Security Test: User Access Functions ==='
SELECT 
    'get_current_user_role()' as function_name,
    get_current_user_role() as result
UNION ALL
SELECT 
    'get_current_user_locations()' as function_name,
    array_to_string(get_current_user_locations(), ', ') as result
UNION ALL
SELECT 
    'auth.uid()' as function_name,
    (select auth.uid())::text as result;

-- 4. Test di accesso ai dati con RLS attivato
\echo '=== Security Test: RLS Access Control ==='

-- Test accesso profiles
SELECT 
    'profiles' as table_name,
    COUNT(*) as accessible_rows,
    'Should show own profile only' as expected
FROM profiles;

-- Test accesso chats
SELECT 
    'chats' as table_name,
    COUNT(*) as accessible_rows,
    'Should show accessible chats only' as expected
FROM chats;

-- Test accesso monthly_inventories
SELECT 
    'monthly_inventories' as table_name,
    COUNT(*) as accessible_rows,
    'Should show inventories for accessible locations only' as expected
FROM monthly_inventories;

-- 5. Verifica performance delle funzioni ottimizzate
\echo '=== Performance Test: Optimized Functions ==='
\timing on

-- Test 100 chiamate alla funzione ottimizzata
SELECT COUNT(*) FROM (
    SELECT get_current_user_locations() 
    FROM generate_series(1, 100)
) as test_calls;

\timing off

-- 6. Test di integrità dei controlli di sicurezza
\echo '=== Integrity Test: Security Functions ==='

-- Verifica che le funzioni di sicurezza non permettano bypass
SELECT 
    has_module_permission('user_management', 'can_validate') as has_user_mgmt_permission,
    has_module_permission('financial', 'can_delete') as has_financial_delete_permission,
    get_user_access_level() as user_access_level;

\echo '=== RLS Optimization Verification Complete ==='
\echo 'Check the results above to ensure:'
\echo '1. All policies show OPTIMIZED status'
\echo '2. Performance metrics are reasonable (< 5ms for simple queries)'
\echo '3. Security functions return expected values'
\echo '4. Row counts reflect proper access control'